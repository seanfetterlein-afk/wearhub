import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Ikke logget ind." }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "Mangler orderId." }, { status: 400 });

  const admin = createServiceClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, buyer_id, seller_id, status, payout")
    .eq("id", orderId)
    .single();

  if (!order)                       return NextResponse.json({ error: "Ordre ikke fundet." },     { status: 404 });
  if (order.buyer_id !== user.id)   return NextResponse.json({ error: "Ikke autoriseret." },      { status: 403 });
  if (order.status !== "shipped")   return NextResponse.json({ error: "Kan ikke bekræfte nu." },  { status: 409 });

  await admin
    .from("orders")
    .update({
      status:       "delivered",
      delivered_at: new Date().toISOString(),
    } as any)
    .eq("id", orderId);

  const { data: conv } = await admin
    .from("conversations")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (conv) {
    await admin.from("messages").insert({
      conversation_id: conv.id,
      sender_id:       user.id,
      text:            "Køber har bekræftet modtagelse. Sælgers saldo frigives nu.",
      message_type:    "system",
    });

    await (admin.rpc as any)("create_notification", {
      p_user_id:        order.seller_id,
      p_type:           "system",
      p_title:          "Levering bekræftet!",
      p_body:           `Køber har modtaget pakken. Din saldo på ${order.payout} kr. er nu frigivet.`,
      p_conversation_id: conv.id,
    }).catch(() => {});
  }

  // ── Release seller wallet funds immediately on delivery confirmation ─────────
  await (admin.rpc as any)("release_wallet_funds", {
    p_user_id: order.seller_id,
    p_amount:  order.payout,
  });

  // Mark the pending wallet transaction as available
  const { data: txns } = await admin
    .from("wallet_transactions")
    .update({ status: "available" })
    .eq("order_id", orderId)
    .eq("type", "sale_pending")
    .eq("status", "pending")
    .select("id, amount");

  // Record the release
  if (txns && txns.length > 0) {
    await admin.from("wallet_transactions").insert({
      user_id:     order.seller_id,
      order_id:    orderId,
      amount:      order.payout,
      type:        "release_to_available",
      status:      "available",
      description: "Midler frigivet — køber bekræftede levering",
    });
  }

  return NextResponse.json({ success: true });
}
