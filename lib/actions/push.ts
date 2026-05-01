"use server";

import { createClient, getUser } from "@/lib/supabase/server";

export async function saveSubscription(
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
) {
  const user = await getUser();
  if (!user) return;

  const supabase = await createClient();
  await (supabase.from("push_subscriptions") as any).upsert(
    {
      user_id:  user.id,
      endpoint: sub.endpoint,
      p256dh:   sub.keys.p256dh,
      auth:     sub.keys.auth,
    },
    { onConflict: "user_id,endpoint" },
  );
}
