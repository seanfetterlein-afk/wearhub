import { createClient } from "@/lib/supabase/server";

interface CreateNotificationParams {
  userId:         string;
  type:           string;
  title:          string;
  body:           string;
  listingId?:     string | null;
  relatedUserId?: string | null;
  conversationId?: string | null;
}

/**
 * Create a DB notification for any user.
 * Uses a security-definer RPC so the caller's session doesn't need
 * INSERT permission on the notifications table for other users.
 * Never throws — notifications are non-critical.
 */
export async function createNotification(p: CreateNotificationParams) {
  try {
    const supabase = await createClient();
    await (supabase.rpc as any)("create_notification", {
      p_user_id:         p.userId,
      p_type:            p.type,
      p_title:           p.title,
      p_body:            p.body,
      p_listing_id:      p.listingId      ?? null,
      p_related_user_id: p.relatedUserId  ?? null,
      p_conversation_id: p.conversationId ?? null,
    });
  } catch {
    // Silently swallow — never block the primary action
  }
}
