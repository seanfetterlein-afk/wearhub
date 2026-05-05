"use server";

import { stripe } from "@/lib/stripe";
import { createClient, getUser } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const RELEASE_DAYS = 14;

export type WalletTransaction = {
  id: string;
  amount: number;
  type: "sale_pending" | "release_to_available" | "payout" | "refund" | "adjustment";
  status: "pending" | "available" | "paid_out" | "failed" | "refunded";
  description: string | null;
  created_at: string;
  order_id: string | null;
};

export type WalletData = {
  wallet: {
    pending_balance: number;
    available_balance: number;
    currency: string;
  };
  transactions: WalletTransaction[];
  connectOnboarded: boolean;
  connectAccountId: string | null;
};

// ─── getWalletData ────────────────────────────────────────────────────────────

export async function getWalletData(): Promise<{ data?: WalletData; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Ikke logget ind." };

  const supabase = await createClient();
  const admin    = createServiceClient();

  // Auto-release eligible pending funds before returning data
  await releaseEligibleFunds(user.id, admin);

  const [walletResult, txnResult, profileResult] = await Promise.all([
    supabase
      .from("wallets")
      .select("pending_balance, available_balance, currency")
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("wallet_transactions")
      .select("id, amount, type, status, description, created_at, order_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),

    supabase
      .from("profiles")
      .select("stripe_connect_account_id, stripe_connect_onboarded")
      .eq("id", user.id)
      .single(),
  ]);

  const profile = profileResult.data as any;

  return {
    data: {
      wallet:           walletResult.data ?? { pending_balance: 0, available_balance: 0, currency: "dkk" },
      transactions:     (txnResult.data ?? []) as WalletTransaction[],
      connectOnboarded: profile?.stripe_connect_onboarded ?? false,
      connectAccountId: profile?.stripe_connect_account_id ?? null,
    },
  };
}

// ─── releaseEligibleFunds (internal) ─────────────────────────────────────────

async function releaseEligibleFunds(
  userId: string,
  admin: ReturnType<typeof createServiceClient>,
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RELEASE_DAYS);

  // All pending sale transactions for this user
  const { data: pendingTxns } = await admin
    .from("wallet_transactions")
    .select("id, amount, order_id, created_at")
    .eq("user_id", userId)
    .eq("type", "sale_pending")
    .eq("status", "pending");

  if (!pendingTxns || pendingTxns.length === 0) return;

  const eligible: typeof pendingTxns = [];

  // Time-based: older than RELEASE_DAYS
  const timeBased = pendingTxns.filter((t) => new Date(t.created_at) < cutoff);
  eligible.push(...timeBased);

  // Order-based: buyer confirmed delivery (status = delivered)
  const remaining = pendingTxns.filter(
    (t) => new Date(t.created_at) >= cutoff && t.order_id,
  );
  if (remaining.length > 0) {
    const orderIds = remaining.map((t) => t.order_id!);
    const { data: delivered } = await admin
      .from("orders")
      .select("id")
      .in("id", orderIds)
      .eq("status", "delivered");

    if (delivered && delivered.length > 0) {
      const deliveredSet = new Set(delivered.map((o) => o.id));
      eligible.push(...remaining.filter((t) => deliveredSet.has(t.order_id!)));
    }
  }

  for (const txn of eligible) {
    // Optimistic lock: only proceed if status is still 'pending'
    const { data: updated } = await admin
      .from("wallet_transactions")
      .update({ status: "available" })
      .eq("id", txn.id)
      .eq("status", "pending")
      .select("id");

    if (!updated || updated.length === 0) continue; // Already handled

    await (admin.rpc as any)("release_wallet_funds", {
      p_user_id: userId,
      p_amount:  txn.amount,
    });

    await admin.from("wallet_transactions").insert({
      user_id:     userId,
      order_id:    txn.order_id,
      amount:      txn.amount,
      type:        "release_to_available",
      status:      "available",
      description: "Midler frigivet til udbetaling",
    });
  }
}

// ─── initiateConnectOnboarding ────────────────────────────────────────────────

export async function initiateConnectOnboarding(): Promise<{ url?: string; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Ikke logget ind." };

  const supabase = await createClient();
  const admin    = createServiceClient();
  const origin   = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_connect_account_id")
    .eq("id", user.id)
    .single() as { data: any };

  let accountId = profile?.stripe_connect_account_id as string | null;

  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        type:          "express",
        country:       "DK",
        email:         user.email,
        capabilities:  { transfers: { requested: true } },
        business_type: "individual",
      } as any);
      accountId = account.id;

      await admin
        .from("profiles")
        .update({ stripe_connect_account_id: accountId, stripe_connect_onboarded: false })
        .eq("id", user.id);
    }

    const accountLink = await stripe.accountLinks.create({
      account:     accountId!,
      refresh_url: `${origin}/api/stripe/connect/onboard`,
      return_url:  `${origin}/api/stripe/connect/callback`,
      type:        "account_onboarding",
    });

    return { url: accountLink.url };
  } catch (err: any) {
    console.error("[connect onboard]", err.message);
    return { error: err.message ?? "Kunne ikke starte opsætning." };
  }
}

// ─── withdrawBalance ──────────────────────────────────────────────────────────

export async function withdrawBalance(): Promise<{ success?: boolean; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Ikke logget ind." };

  const supabase = await createClient();
  const admin    = createServiceClient();

  const [walletResult, profileResult] = await Promise.all([
    supabase
      .from("wallets")
      .select("available_balance")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("stripe_connect_account_id, stripe_connect_onboarded")
      .eq("id", user.id)
      .single(),
  ]);

  const wallet  = walletResult.data;
  const profile = profileResult.data as any;

  if (!wallet || wallet.available_balance <= 0) {
    return { error: "Ingen saldo klar til udbetaling." };
  }
  if (!profile?.stripe_connect_account_id) {
    return { error: "Tilknyt din bankkonto først." };
  }
  if (!profile.stripe_connect_onboarded) {
    return { error: "Fuldfør Stripe-opsætning inden udbetaling." };
  }

  const amount = wallet.available_balance;

  // 1. Atomically deduct balance (throws if insufficient — prevents double-spend)
  const { error: deductError } = await (admin.rpc as any)("deduct_available_balance", {
    p_user_id: user.id,
    p_amount:  amount,
  });
  if (deductError) return { error: "Kunne ikke reservere saldo. Prøv igen." };

  try {
    // 2. Create Stripe Transfer to connected account
    const transfer = await stripe.transfers.create({
      amount:      amount * 100, // DKK → ører
      currency:    "dkk",
      destination: profile.stripe_connect_account_id,
      description: "WearHub saldo udbetaling",
    });

    // 3. Record successful payout
    await admin.from("wallet_transactions").insert({
      user_id:           user.id,
      stripe_transfer_id: transfer.id,
      amount,
      type:        "payout",
      status:      "paid_out",
      description: `Udbetaling — ${amount} kr`,
    });

    return { success: true };
  } catch (err: any) {
    console.error("[withdraw] Stripe transfer failed:", err.message);

    // Roll back: add funds back to available balance
    await (admin.rpc as any)("add_to_available_balance", {
      p_user_id: user.id,
      p_amount:  amount,
    });

    await admin.from("wallet_transactions").insert({
      user_id:     user.id,
      amount,
      type:        "payout",
      status:      "failed",
      description: `Udbetaling fejlede: ${err.message}`,
    });

    return { error: "Udbetaling fejlede. Pengene er ikke trukket. Prøv igen." };
  }
}
