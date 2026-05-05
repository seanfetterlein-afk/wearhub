import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { createShippingLabel, type ShippingCarrier } from "@/lib/services/shippingService";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error("[stripe webhook] signature verification failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const admin = createServiceClient();

  if (event.type === "checkout.session.completed") {
    const session         = event.data.object as any;
    const meta            = session.metadata ?? {};
    const paymentIntentId = session.payment_intent as string | null;

    const productId      = meta.product_id;
    const buyerId        = meta.buyer_id;
    const sellerId       = meta.seller_id;
    const conversationId = meta.conversation_id as string | undefined;

    // Price fields — fall back to legacy single-amount for old sessions
    const itemPrice     = Number(meta.item_price    || meta.amount || 0);
    const shippingPrice = Number(meta.shipping_price || 0);
    const platformFee   = Number(meta.platform_fee  || 0);
    const totalPrice    = Number(meta.total_price   || itemPrice);
    const payout        = Number(meta.payout        || 0);

    // Shipping fields
    const shippingCarrier: ShippingCarrier | undefined =
      (meta.shipping_carrier as ShippingCarrier) || undefined;
    const shippingMethod  = meta.shipping_method   || null;
    const buyerName       = meta.buyer_name        || null;
    const buyerAddress    = meta.buyer_address      || null;
    const buyerCity       = meta.buyer_city         || null;
    const buyerZip        = meta.buyer_zip          || null;

    if (!productId || !buyerId || !sellerId) {
      console.error("[stripe webhook] missing metadata", meta);
      return NextResponse.json({ error: "missing metadata" }, { status: 400 });
    }

    // ── Idempotency ───────────────────────────────────────────────────────────
    if (paymentIntentId) {
      const { data: existing } = await admin
        .from("wallet_transactions")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .eq("type", "sale_pending")
        .maybeSingle();

      if (existing) {
        console.log("[stripe webhook] duplicate event, skipping:", paymentIntentId);
        return NextResponse.json({ received: true });
      }
    }

    // ── Ship-by deadline: 5 days from now ────────────────────────────────────
    const shipByDate = new Date();
    shipByDate.setDate(shipByDate.getDate() + 5);

    // ── Create order ──────────────────────────────────────────────────────────
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        product_id:               productId,
        buyer_id:                 buyerId,
        seller_id:                sellerId,
        amount:                   totalPrice,
        item_price:               itemPrice || null,
        shipping_price:           shippingPrice || null,
        platform_fee:             platformFee || null,
        total_price:              totalPrice || null,
        payout,
        stripe_payment_intent_id: paymentIntentId,
        status:                   shippingCarrier ? "awaiting_seller_shipping" : "paid",
        shipping_deadline:        shipByDate.toISOString(),
        buyer_name:               buyerName,
        buyer_address:            buyerAddress,
        buyer_city:               buyerCity,
        buyer_zip:                buyerZip,
        shipping_carrier:         shippingCarrier ?? null,
        shipping_method:          shippingMethod,
      } as any)
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("[stripe webhook] order insert failed:", orderError?.message);
      return NextResponse.json({ error: orderError?.message ?? "order insert failed" }, { status: 500 });
    }

    // ── Mark listing as sold ──────────────────────────────────────────────────
    await admin.from("products").update({ status: "sold" }).eq("id", productId);

    // ── Create shipping label (mock) ──────────────────────────────────────────
    let shipment: { tracking_number: string; tracking_url: string; label_url: string; package_code: string } | null = null;

    if (shippingCarrier && buyerName) {
      try {
        const label = await createShippingLabel({
          orderId:          order.id,
          carrier:          shippingCarrier,
          methodType:       (shippingMethod ?? "pakkeshop") as "pakkeshop" | "home",
          recipientName:    buyerName,
          recipientAddress: buyerAddress ?? "",
          recipientCity:    buyerCity    ?? "",
          recipientZip:     buyerZip     ?? "",
        });

        const { data: shipmentRow } = await admin
          .from("shipments")
          .insert({
            order_id:        order.id,
            carrier:         shippingCarrier,
            shipping_method: shippingMethod ?? "pakkeshop",
            label_url:       label.labelUrl,
            tracking_number: label.trackingNumber,
            tracking_url:    label.trackingUrl,
            package_code:    label.packageCode,
            status:          "label_created",
          })
          .select("tracking_number, tracking_url, label_url, package_code")
          .single();

        shipment = shipmentRow;
      } catch (err) {
        console.error("[stripe webhook] shipping label creation failed:", err);
      }
    }

    // ── Link order to conversation ────────────────────────────────────────────
    if (conversationId) {
      await admin
        .from("conversations")
        .update({ order_id: order.id })
        .eq("id", conversationId);

      // Rich system messages
      const deadlineStr = shipByDate.toLocaleDateString("da-DK", {
        day: "numeric", month: "long",
      });

      const systemMessages: string[] = [
        `Køber har betalt ${totalPrice} kr. Ordren er oprettet og fragt er inkluderet.`,
      ];

      if (shippingCarrier && shipment) {
        systemMessages.push(
          `Fragtlabel er klar (${shippingCarrier}). Sælger skal sende pakken senest ${deadlineStr}.`,
        );
        if (shipment.tracking_number) {
          systemMessages.push(
            `Trackingnummer: ${shipment.tracking_number}. Sælger: brug kode ${shipment.package_code} ved ${shippingCarrier} pakkeshop.`,
          );
        }
      } else {
        systemMessages.push(
          `Sælger skal bekræfte og sende pakken senest ${deadlineStr}.`,
        );
      }

      for (const text of systemMessages) {
        await admin.from("messages").insert({
          conversation_id: conversationId,
          sender_id:       buyerId,
          text,
          message_type:    "system",
        });
      }

      // Order events log
      await admin.from("order_events").insert([
        { order_id: order.id, event_type: "payment_received",    message: `Betaling modtaget — ${totalPrice} kr` },
        { order_id: order.id, event_type: "order_created",       message: "Ordre oprettet" },
        ...(shipment
          ? [{ order_id: order.id, event_type: "label_created", message: `Fragtlabel oprettet — ${shippingCarrier}` }]
          : []),
      ]);
    }

    // ── Seller wallet: add payout to pending balance ──────────────────────────
    const { error: walletError } = await (admin.rpc as any)("add_to_pending_balance", {
      p_user_id: sellerId,
      p_amount:  payout,
    });

    if (!walletError) {
      await admin.from("wallet_transactions").insert({
        user_id:                  sellerId,
        order_id:                 order.id,
        stripe_payment_intent_id: paymentIntentId,
        amount:                   payout,
        type:                     "sale_pending",
        status:                   "pending",
        description:              `Salg — ${itemPrice} kr (fragt: ${shippingPrice} kr, gebyr: ${platformFee} kr)`,
      });
    }

    // ── Notify seller ─────────────────────────────────────────────────────────
    const sellerBody = shippingCarrier && shipment
      ? `Betaling modtaget. Fragtlabel er klar — brug kode ${shipment.package_code} ved ${shippingCarrier} pakkeshop. Send inden ${shipByDate.toLocaleDateString("da-DK", { day: "numeric", month: "long" })}.`
      : `Betaling modtaget. Bekræft ordre og send pakken inden for 5 dage.`;

    await (admin.rpc as any)("create_notification", {
      p_user_id:         sellerId,
      p_type:            "system",
      p_title:           "Din vare er solgt! 🎉",
      p_body:            sellerBody,
      p_listing_id:      productId,
      p_conversation_id: conversationId ?? null,
    }).catch(() => {});
  }

  return NextResponse.json({ received: true });
}
