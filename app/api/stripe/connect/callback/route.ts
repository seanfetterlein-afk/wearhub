import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getUser } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

// Stripe redirects here after the seller completes onboarding.
// We verify the account is fully set up and mark them as onboarded.
export async function GET() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const admin = createServiceClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_connect_account_id")
    .eq("id", user.id)
    .single() as { data: any };

  if (!profile?.stripe_connect_account_id) {
    return NextResponse.redirect(`${origin}/profile?connect_error=no_account`);
  }

  try {
    const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
    const onboarded = account.details_submitted ?? false;

    await admin
      .from("profiles")
      .update({ stripe_connect_onboarded: onboarded })
      .eq("id", user.id);

    const param = onboarded ? "connect_success=1" : "connect_incomplete=1";
    return NextResponse.redirect(`${origin}/profile?${param}`);
  } catch (err: any) {
    console.error("[connect callback]", err.message);
    return NextResponse.redirect(
      `${origin}/profile?connect_error=${encodeURIComponent(err.message)}`,
    );
  }
}
