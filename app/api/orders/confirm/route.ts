import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Ikke logget ind." }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "Mangler orderId." }, { status: 400 });

  const admin = createServiceClient();

  // Fetch order and validate
  const { data: order } = await admin
    .from("orders")
    .select("id, seller_id, buyer_id, status, product_id, payout")
    .eq("id", orderId)
    .single() as { data: any };

  if (!order)                       return NextResponse.json({ error: "Ordre ikke fundet." },     { status: 404 });
  if (order.seller_id !== user.id)  return NextResponse.json({ error: "Ikke autoriseret." },      { status: 403 });
  if (order.status !== "paid")      return NextResponse.json({ error: "Kan ikke bekræfte nu." },  { status: 409 });

  const shippingDeadline = new Date();
  shippingDeadline.setDate(shippingDeadline.getDate() + 5);

  // Update order
  await admin
    .from("orders")
    .update({
      status:           "confirmed",
      confirmed_at:     new Date().toISOString(),
      shipping_deadline: shippingDeadline.toISOString(),
    } as any)
    .eq("id", orderId);

  // Find conversation
  const { data: conv } = await admin
    .from("conversations")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (conv) {
    const deadline = shippingDeadline.toLocaleDateString("da-DK", { day: "numeric", month: "long" });
    await admin.from("messages").insert({
      conversation_id: conv.id,
      sender_id:       user.id,
      text:            `Sælger har bekræftet ordren. Pakken skal sendes inden ${deadline}.`,
      message_type:    "system",
    });

    // Notify buyer
    await (admin.rpc as any)("create_notification", {
      p_user_id:        order.buyer_id,
      p_type:           "system",
      p_title:          "Ordre bekræftet",
      p_body:           `Sælger har bekræftet din ordre. Pakken sendes inden ${deadline}.`,
      p_conversation_id: conv.id,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
