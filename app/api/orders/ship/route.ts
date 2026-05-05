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
    .select("id, seller_id, buyer_id, status")
    .eq("id", orderId)
    .single();

  if (!order)                 return NextResponse.json({ error: "Ordre ikke fundet." },   { status: 404 });
  if (order.seller_id !== user.id) return NextResponse.json({ error: "Ikke autoriseret." }, { status: 403 });

  // Accept both new flow (awaiting_seller_shipping) and old flow (confirmed)
  const shippableStatuses = ["awaiting_seller_shipping", "confirmed", "label_created"];
  if (!shippableStatuses.includes(order.status)) {
    return NextResponse.json({ error: "Kan ikke markere som sendt nu." }, { status: 409 });
  }

  const shippedAt = new Date().toISOString();

  await admin
    .from("orders")
    .update({ status: "shipped", shipped_at: shippedAt } as any)
    .eq("id", orderId);

  // Update shipment record if exists
  await admin
    .from("shipments")
    .update({ status: "shipped", shipped_at: shippedAt } as any)
    .eq("order_id", orderId);

  // Log order event
  await admin.from("order_events").insert({
    order_id:   orderId,
    event_type: "shipped",
    message:    "Pakken er afsendt af sælger",
  });

  // Build system message — include tracking info if available
  const { data: shipment } = await admin
    .from("shipments")
    .select("carrier, tracking_number, tracking_url, package_code")
    .eq("order_id", orderId)
    .maybeSingle();

  const { data: conv } = await admin
    .from("conversations")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (conv) {
    let msgText = "Pakken er afsendt.";
    if (shipment?.tracking_number) {
      msgText = `Pakken er afsendt med ${shipment.carrier}. Trackingnummer: ${shipment.tracking_number}`;
      if (shipment.tracking_url) {
        msgText += ` — følg pakken på ${shipment.tracking_url}`;
      }
      msgText += ". Bekræft modtagelse når pakken ankommer.";
    } else {
      msgText = "Pakken er afsendt. Bekræft modtagelse når pakken ankommer.";
    }

    await admin.from("messages").insert({
      conversation_id: conv.id,
      sender_id:       user.id,
      text:            msgText,
      message_type:    "system",
    });

    await (admin.rpc as any)("create_notification", {
      p_user_id:         order.buyer_id,
      p_type:            "system",
      p_title:           "Pakken er sendt!",
      p_body:            shipment?.tracking_number
        ? `Trackingnummer: ${shipment.tracking_number}. Bekræft modtagelse når den ankommer.`
        : "Sælger har afsendt din pakke. Bekræft modtagelse når den ankommer.",
      p_conversation_id: conv.id,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
