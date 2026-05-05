"use server";

import { stripe } from "@/lib/stripe";
import { createClient, getUser } from "@/lib/supabase/server";
import { calculatePayout } from "@/lib/supabase/helpers";
import {
  calculateShippingPrice,
  calculatePlatformFee,
  getShippingOption,
  type ShippingCarrier,
} from "@/lib/services/shippingService";

export interface CheckoutAddress {
  name:        string;
  addressLine: string;
  city:        string;
  zip:         string;
}

export async function createCheckoutSession(
  productId:        string,
  shippingCarrier:  ShippingCarrier,
  address:          CheckoutAddress,
): Promise<{ url?: string; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "login" };

  if (
    !address.name.trim() ||
    !address.addressLine.trim() ||
    !address.city.trim() ||
    !address.zip.trim()
  ) {
    return { error: "Udfyld alle adressefelter." };
  }

  const supabase = await createClient();

  const { data: product } = await (supabase.from("products") as any)
    .select("id, title, brand, price, seller_id, status, product_images(storage_path, position)")
    .eq("id", productId)
    .single();

  if (!product)                     return { error: "Annonce ikke fundet." };
  if (product.status !== "active")  return { error: "Denne annonce er ikke længere tilgængelig." };
  if (product.seller_id === user.id) return { error: "Du kan ikke købe din egen annonce." };

  // ── Find or create conversation ──────────────────────────────────────────────
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id")
    .eq("product_id", productId)
    .eq("buyer_id", user.id)
    .eq("seller_id", product.seller_id)
    .maybeSingle();

  let conversationId: string;

  if (existingConv) {
    conversationId = existingConv.id;
  } else {
    const { data: newConv, error: convError } = await supabase
      .from("conversations")
      .insert({ product_id: productId, buyer_id: user.id, seller_id: product.seller_id })
      .select("id")
      .single();
    if (convError || !newConv) return { error: "Kunne ikke oprette samtale." };
    conversationId = newConv.id;
  }

  // ── Price calculation ────────────────────────────────────────────────────────
  const itemPrice     = product.price;
  const shippingPrice = calculateShippingPrice(shippingCarrier);
  const platformFee   = calculatePlatformFee(itemPrice);
  const totalPrice    = itemPrice + shippingPrice + platformFee;
  const payout        = calculatePayout(itemPrice);
  const option        = getShippingOption(shippingCarrier);

  // ── Product image ────────────────────────────────────────────────────────────
  const images   = (product.product_images ?? []).sort((a: any, b: any) => a.position - b.position);
  const imageUrl = images[0]?.storage_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${images[0].storage_path}`
    : undefined;

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode:                 "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency:     "dkk",
          unit_amount:  itemPrice * 100,
          product_data: {
            name:   `${product.brand} — ${product.title}`,
            images: imageUrl ? [imageUrl] : [],
          },
        },
        quantity: 1,
      },
      {
        price_data: {
          currency:     "dkk",
          unit_amount:  shippingPrice * 100,
          product_data: { name: `Fragt — ${option.label}` },
        },
        quantity: 1,
      },
      {
        price_data: {
          currency:     "dkk",
          unit_amount:  platformFee * 100,
          product_data: { name: "Køberbeskyttelse" },
        },
        quantity: 1,
      },
    ],
    metadata: {
      product_id:       productId,
      buyer_id:         user.id,
      seller_id:        product.seller_id,
      conversation_id:  conversationId,
      item_price:       String(itemPrice),
      shipping_price:   String(shippingPrice),
      platform_fee:     String(platformFee),
      total_price:      String(totalPrice),
      payout:           String(payout),
      shipping_carrier: shippingCarrier,
      shipping_method:  option.methodType,
      buyer_name:       address.name,
      buyer_address:    address.addressLine,
      buyer_city:       address.city,
      buyer_zip:        address.zip,
    },
    success_url: `${origin}/messages/${conversationId}?checkout=success`,
    cancel_url:  `${origin}/checkout/${productId}`,
  });

  return { url: session.url ?? undefined };
}
