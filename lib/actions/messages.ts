"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";
import { createNotification } from "@/lib/notifications";
import { formatPrice } from "@/lib/utils";

/** Send a plain text message in an existing conversation. */
export async function sendMessage(
  conversationId: string,
  text: string,
): Promise<{ message?: { id: string; createdAt: string }; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Ikke logget ind." };
  if (!text.trim()) return { error: "Besked må ikke være tom." };

  const supabase = await createClient();
  const { data, error } = await (supabase.from("messages") as any)
    .insert({
      conversation_id: conversationId,
      sender_id:       user.id,
      text:            text.trim(),
      message_type:    "text",
    })
    .select("id, created_at")
    .single();

  if (error) return { error: error.message };

  // Notify the other participant
  const { data: conv } = await (supabase.from("conversations") as any)
    .select("buyer_id, seller_id")
    .eq("id", conversationId)
    .single();
  if (conv) {
    const recipientId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
    createNotification({
      userId:         recipientId,
      type:           "message",
      title:          "Ny besked",
      body:           text.trim().slice(0, 100),
      conversationId,
      relatedUserId:  user.id,
    }).catch(() => {});
    sendPushToUser(recipientId, {
      title: "Ny besked",
      body:  text.trim().slice(0, 80),
      url:   `/messages/${conversationId}`,
    }).catch(() => {});
  }

  // Only revalidate the inbox list — not the conversation page itself,
  // which would trigger a router refresh and fight the optimistic state.
  revalidatePath("/messages");
  return { message: { id: data.id, createdAt: data.created_at } };
}

/**
 * Find an existing conversation or create a new one.
 * Avoids upsert because the conversations UPDATE policy doesn't exist,
 * which causes RLS violations when the row already exists.
 */
async function findOrCreateConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  buyerId: string,
  sellerId: string,
): Promise<{ id: string } | { error: string }> {
  // Try to find existing first
  const { data: existing } = await (supabase.from("conversations") as any)
    .select("id")
    .eq("product_id", productId)
    .eq("buyer_id", buyerId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (existing) return { id: existing.id };

  // None found — insert a new one
  const { data: created, error } = await (supabase.from("conversations") as any)
    .insert({ product_id: productId, buyer_id: buyerId, seller_id: sellerId })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: created.id };
}

/** Start a new conversation about a product, or return existing one. */
export async function startConversation(
  productId: string,
  sellerId: string,
  initialMessage: string,
): Promise<{ conversationId?: string; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Ikke logget ind." };
  if (user.id === sellerId) return { error: "Du kan ikke sende besked til dig selv." };

  const supabase = await createClient();

  const result = await findOrCreateConversation(supabase, productId, user.id, sellerId);
  if ("error" in result) return { error: result.error };

  if (initialMessage.trim()) {
    await (supabase.from("messages") as any).insert({
      conversation_id: result.id,
      sender_id:       user.id,
      text:            initialMessage.trim(),
      message_type:    "text",
    });
  }

  revalidatePath("/messages");
  return { conversationId: result.id };
}

/**
 * Start a conversation and immediately submit an offer.
 * Called from the item page "Make Offer" flow.
 */
export async function startConversationWithOffer(
  productId: string,
  sellerId: string,
  amount: number,
): Promise<{ conversationId?: string; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Ikke logget ind." };
  if (user.id === sellerId) return { error: "Du kan ikke sende bud til dig selv." };
  if (!Number.isInteger(amount) || amount <= 0)
    return { error: "Beløbet skal være et positivt heltal." };

  const supabase = await createClient();

  const convResult = await findOrCreateConversation(supabase, productId, user.id, sellerId);
  if ("error" in convResult) return { error: convResult.error };
  const conv = { id: convResult.id };

  // Create offer
  const { data: offer, error: offerError } = await (supabase
    .from("offers") as any)
    .insert({
      conversation_id: conv.id,
      buyer_id:        user.id,
      seller_id:       sellerId,
      amount,
    })
    .select("id")
    .single();

  if (offerError) return { error: offerError.message };

  // Send offer message (human-readable text + structured type)
  await (supabase.from("messages") as any).insert({
    conversation_id: conv.id,
    sender_id:       user.id,
    text:            `Bud: ${formatPrice(amount)}`,
    message_type:    "offer",
    offer_id:        offer.id,
  });

  revalidatePath("/messages");
  return { conversationId: conv.id };
}

/**
 * Submit a new offer inside an existing conversation.
 * Only the buyer of the conversation may call this.
 */
export async function makeOffer(
  conversationId: string,
  amount: number,
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Ikke logget ind." };
  if (!Number.isInteger(amount) || amount <= 0)
    return { error: "Beløbet skal være et positivt heltal." };

  const supabase = await createClient();

  // Verify caller is the buyer
  const { data: conv } = await (supabase.from("conversations") as any)
    .select("id, buyer_id, seller_id")
    .eq("id", conversationId)
    .single();

  if (!conv) return { error: "Samtale ikke fundet." };
  if (conv.buyer_id !== user.id)
    return { error: "Kun køber kan sende bud." };

  // Create offer
  const { data: offer, error: offerError } = await (supabase
    .from("offers") as any)
    .insert({
      conversation_id: conversationId,
      buyer_id:        conv.buyer_id,
      seller_id:       conv.seller_id,
      amount,
    })
    .select("id")
    .single();

  if (offerError) return { error: offerError.message };

  // Send offer message
  const { error: msgError } = await (supabase.from("messages") as any).insert({
    conversation_id: conversationId,
    sender_id:       user.id,
    text:            `Bud: ${formatPrice(amount)}`,
    message_type:    "offer",
    offer_id:        offer.id,
  });

  if (msgError) return { error: msgError.message };

  // Notify seller (DB + push)
  createNotification({
    userId:         conv.seller_id,
    type:           "offer_received",
    title:          "Nyt bud modtaget",
    body:           `Du har modtaget et bud på ${formatPrice(amount)}`,
    conversationId,
    relatedUserId:  user.id,
  }).catch(() => {});
  sendPushToUser(conv.seller_id, {
    title: "Nyt bud modtaget",
    body:  `Du har modtaget et bud på ${formatPrice(amount)}`,
    url:   `/messages/${conversationId}`,
  }).catch(() => {});

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return {};
}

/**
 * Seller accepts or rejects a pending offer.
 */
export async function respondToOffer(
  offerId: string,
  response: "accepted" | "rejected",
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Ikke logget ind." };

  const supabase = await createClient();

  // Load and verify
  const { data: offer } = await (supabase.from("offers") as any)
    .select("id, conversation_id, seller_id, status")
    .eq("id", offerId)
    .single();

  if (!offer) return { error: "Bud ikke fundet." };
  if (offer.seller_id !== user.id) return { error: "Kun sælger kan svare på bud." };
  if (offer.status !== "pending") return { error: "Dette bud er allerede besvaret." };

  // Update offer status
  const { error: updateError } = await (supabase.from("offers") as any)
    .update({ status: response })
    .eq("id", offerId);

  if (updateError) return { error: updateError.message };

  // Send a status message into the conversation
  const text = response === "accepted" ? "Bud accepteret ✓" : "Bud afvist";
  await (supabase.from("messages") as any).insert({
    conversation_id: offer.conversation_id,
    sender_id:       user.id,
    text,
    message_type:    "text",
  });

  // Notify buyer (DB + push)
  createNotification({
    userId:         offer.buyer_id,
    type:           response === "accepted" ? "offer_accepted" : "offer_rejected",
    title:          response === "accepted" ? "Bud accepteret ✓" : "Bud afvist",
    body:           response === "accepted"
      ? "Sælgeren har accepteret dit bud."
      : "Sælgeren har afvist dit bud.",
    conversationId: offer.conversation_id,
    relatedUserId:  user.id,
  }).catch(() => {});
  sendPushToUser(offer.buyer_id, {
    title: response === "accepted" ? "Bud accepteret ✓" : "Bud afvist",
    body:  response === "accepted"
      ? "Sælgeren har accepteret dit bud."
      : "Sælgeren har afvist dit bud.",
    url: `/messages/${offer.conversation_id}`,
  }).catch(() => {});

  revalidatePath(`/messages/${offer.conversation_id}`);
  revalidatePath("/messages");
  return {};
}

/** Mark all unread incoming messages in a conversation as read. */
export async function markConversationRead(conversationId: string) {
  const user = await getUser();
  if (!user) return;

  const supabase = await createClient();
  await (supabase
    .from("messages") as any)
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  revalidatePath("/messages");
}
