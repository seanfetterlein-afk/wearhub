import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { Marquee } from "@/components/layout/Marquee";
import { Navbar } from "@/components/layout/Navbar";
import { Avatar } from "@/components/ui/Avatar";
import { ConversationThread } from "@/components/messages/ConversationThread";
import { OrderStatusCard } from "@/components/messages/OrderStatusCard";
import { isSupabaseConfigured, storageUrl } from "@/lib/supabase/helpers";
import { createClient, getUser } from "@/lib/supabase/server";
import { markConversationRead } from "@/lib/actions/messages";
import { DUMMY_CONVERSATIONS } from "@/lib/data/messages";
import { CURRENT_USER } from "@/lib/data/users";
import { formatPrice } from "@/lib/utils";
import type { Message, Offer, Order, Shipment } from "@/types";

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const { conversationId } = await params;

  let myId                = CURRENT_USER.id;
  let myName              = CURRENT_USER.displayName;
  let isSeller            = false;
  let participantName     = "";
  let participantUsername = "";
  let participantVerified = false;
  let productId           = "";
  let productBrand        = "";
  let productTitle        = "";
  let productPrice        = 0;
  let productImageUrl     = "";
  let messages: Message[] = [];
  let initialOffers: Record<string, Offer> = {};
  let order: Order | null = null;
  let shipment: Shipment | null = null;

  if (isSupabaseConfigured()) {
    const user = await getUser();
    if (!user) notFound();

    myId = user.id;

    const supabase = await createClient();

    // Load conversation + messages + offers + order
    const [{ data: conv }, { data: offersData }] = await Promise.all([
      supabase
        .from("conversations")
        .select(`
          id, buyer_id, seller_id, order_id,
          products(id, title, brand, price, product_images(storage_path, position)),
          buyer:profiles!buyer_id(id, username, display_name, is_verified),
          seller:profiles!seller_id(id, username, display_name, is_verified),
          messages(id, sender_id, text, is_read, message_type, offer_id, created_at)
        `)
        .eq("id", conversationId)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .single(),
      (supabase.from("offers") as any)
        .select("id, conversation_id, buyer_id, seller_id, amount, status, created_at")
        .eq("conversation_id", conversationId),
    ]);

    if (!conv) notFound();

    isSeller = (conv as any).seller_id === user.id;

    const me    = isSeller ? (conv as any).seller : (conv as any).buyer;
    const other = isSeller ? (conv as any).buyer  : (conv as any).seller;
    const prod  = (conv as any).products;

    myName              = me?.display_name ?? me?.username ?? "Du";
    participantName     = other?.display_name ?? other?.username ?? "Anonym";
    participantUsername = other?.username ?? "";
    participantVerified = other?.is_verified ?? false;
    productId           = prod?.id ?? "";
    productBrand        = prod?.brand ?? "";
    productTitle        = prod?.title ?? "";
    productPrice        = prod?.price ?? 0;
    productImageUrl     = storageUrl(
      prod?.product_images
        ?.sort((a: any, b: any) => a.position - b.position)[0]
        ?.storage_path ?? null,
    ) ?? "";

    messages = ((conv as any).messages ?? [])
      .sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      .map((m: any) => ({
        id:          m.id,
        senderId:    m.sender_id,
        text:        m.text,
        createdAt:   m.created_at,
        messageType: m.message_type ?? "text",
        offerId:     m.offer_id ?? null,
      }));

    initialOffers = ((offersData ?? []) as any[]).reduce(
      (acc: Record<string, Offer>, o: any) => {
        acc[o.id] = {
          id:             o.id,
          conversationId: o.conversation_id,
          buyerId:        o.buyer_id,
          sellerId:       o.seller_id,
          amount:         o.amount,
          status:         o.status,
          createdAt:      o.created_at,
        };
        return acc;
      },
      {},
    );

    // Fetch order + shipment if this conversation is linked to one
    const orderId = (conv as any).order_id as string | null;
    if (orderId) {
      const [{ data: orderRow }, { data: shipmentRow }] = await Promise.all([
        supabase
          .from("orders")
          .select("id, product_id, buyer_id, seller_id, amount, payout, status, confirmed_at, shipping_deadline, shipped_at, delivered_at, completed_at, created_at, item_price, shipping_price, platform_fee, total_price, buyer_name, buyer_address, buyer_city, buyer_zip, shipping_carrier, shipping_method")
          .eq("id", orderId)
          .single() as Promise<{ data: any }>,
        supabase
          .from("shipments")
          .select("id, order_id, carrier, shipping_method, label_url, tracking_number, tracking_url, package_code, status, created_at, shipped_at")
          .eq("order_id", orderId)
          .maybeSingle() as Promise<{ data: any }>,
      ]);

      if (orderRow) {
        order = {
          id:               orderRow.id,
          productId:        orderRow.product_id,
          buyerId:          orderRow.buyer_id,
          sellerId:         orderRow.seller_id,
          amount:           orderRow.amount,
          payout:           orderRow.payout,
          status:           orderRow.status,
          confirmedAt:      orderRow.confirmed_at      ?? null,
          shippingDeadline: orderRow.shipping_deadline ?? null,
          shippedAt:        orderRow.shipped_at        ?? null,
          deliveredAt:      orderRow.delivered_at      ?? null,
          completedAt:      orderRow.completed_at      ?? null,
          createdAt:        orderRow.created_at,
          itemPrice:        orderRow.item_price        ?? null,
          shippingPrice:    orderRow.shipping_price    ?? null,
          platformFee:      orderRow.platform_fee      ?? null,
          totalPrice:       orderRow.total_price       ?? null,
          buyerName:        orderRow.buyer_name        ?? null,
          buyerAddress:     orderRow.buyer_address     ?? null,
          buyerCity:        orderRow.buyer_city        ?? null,
          buyerZip:         orderRow.buyer_zip         ?? null,
          shippingCarrier:  orderRow.shipping_carrier  ?? null,
          shippingMethod:   orderRow.shipping_method   ?? null,
        };
      }

      if (shipmentRow) {
        shipment = {
          id:             shipmentRow.id,
          orderId:        shipmentRow.order_id,
          carrier:        shipmentRow.carrier,
          shippingMethod: shipmentRow.shipping_method,
          labelUrl:       shipmentRow.label_url       ?? null,
          trackingNumber: shipmentRow.tracking_number ?? null,
          trackingUrl:    shipmentRow.tracking_url    ?? null,
          packageCode:    shipmentRow.package_code    ?? null,
          status:         shipmentRow.status,
          createdAt:      shipmentRow.created_at,
          shippedAt:      shipmentRow.shipped_at      ?? null,
        };
      }
    }

    // Mark incoming messages as read (fire-and-forget)
    markConversationRead(conversationId);

  } else {
    const conv = DUMMY_CONVERSATIONS.find((c) => c.id === conversationId);
    if (!conv) notFound();

    participantName     = conv.participant.displayName;
    participantUsername = conv.participant.username;
    participantVerified = conv.participant.isVerified;
    productId           = conv.product.id;
    productBrand        = conv.product.brand;
    productTitle        = conv.product.title;
    productPrice        = conv.product.price;
    messages            = conv.messages.map((m) => ({
      ...m,
      messageType: "text" as const,
    }));
  }

  return (
    <div className="bg-paper min-h-screen flex flex-col font-body">
      <Marquee />
      <Navbar />

      <div className="flex-1 flex flex-col max-w-[800px] w-full mx-auto px-0 sm:px-6">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-4 sm:px-0 py-4 border-b border-brown/20 bg-paper">
          <Link href="/messages" className="text-ink-dim hover:text-ink transition-colors">
            <ArrowLeft size={18} />
          </Link>

          <Avatar name={participantName} size="sm" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-body font-semibold text-ink text-sm">
                {participantName}
              </span>
              {participantVerified && (
                <ShieldCheck size={12} className="text-brown shrink-0" />
              )}
            </div>
            <span className="font-mono text-[9px] tracking-wider text-ink-dim">
              @{participantUsername}
            </span>
          </div>

          {isSeller && (
            <span className="font-mono text-[9px] tracking-widest text-ink-dim uppercase border border-brown/20 px-2 py-0.5">
              DIN ANNONCE
            </span>
          )}
        </div>

        {/* ── Product banner ──────────────────────────────────────────────── */}
        <Link
          href={`/item/${productId}`}
          className="flex items-center gap-3 px-4 sm:px-0 py-3 border-b border-brown/15 bg-cream/60 hover:bg-cream transition-colors group"
        >
          <div className="w-10 h-10 bg-cream-deep border border-brown/15 shrink-0 overflow-hidden">
            {productImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productImageUrl}
                alt={productTitle}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[9px] tracking-widest text-ink-dim uppercase">
              {productBrand}
            </p>
            <p className="font-body text-sm font-medium text-ink truncate">{productTitle}</p>
          </div>
          <div className="text-right shrink-0">
            <p
              className="font-display font-semibold text-brown"
              style={{ fontSize: 15, letterSpacing: "-0.01em" }}
            >
              {formatPrice(productPrice)}
            </p>
            <ExternalLink
              size={11}
              className="text-ink-dim ml-auto mt-0.5 group-hover:text-brown transition-colors"
            />
          </div>
        </Link>

        {/* ── Order status card (shown when this chat has an order) ────────── */}
        {order && (
          <OrderStatusCard
            initialOrder={order}
            initialShipment={shipment}
            myId={myId}
            isSeller={isSeller}
          />
        )}

        {/* ── Thread + input ───────────────────────────────────────────────── */}
        <ConversationThread
          conversationId={conversationId}
          initialMessages={messages}
          initialOffers={initialOffers}
          myId={myId}
          isSeller={isSeller}
          participantName={participantName}
          myName={myName}
          listingPrice={productPrice}
        />
      </div>
    </div>
  );
}
