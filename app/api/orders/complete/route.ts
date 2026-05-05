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
    .select("id, buyer_id, seller_id, status")
    .eq("id", orderId)
    .single() as { data: any };

  if (!order)                       return NextResponse.json({ error: "Ordre ikke fundet." },   { status: 404 });
  if (order.buyer_id !== user.id)   return NextResponse.json({ error: "Ikke autoriseret." },    { status: 403 });
  if (order.status !== "delivered") return NextResponse.json({ error: "Kan ikke fuldføre nu." }, { status: 409 });

  await admin
    .from("orders")
    .update({
      status:       "completed",
      completed_at: new Date().toISOString(),
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
      text:            "Handel fuldført. Tak for en god handel!",
      message_type:    "system",
    });

    await (admin.rpc as any)("create_notification", {
      p_user_id:        order.seller_id,
      p_type:           "system",
      p_title:          "Handel fuldført",
      p_body:           "Køber har markeret handlen som fuldført. Tak for en god handel!",
      p_conversation_id: conv.id,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
