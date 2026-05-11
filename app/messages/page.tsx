import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { InboxClient } from "@/components/inbox/InboxClient";
import { isSupabaseConfigured, storageUrl } from "@/lib/supabase/helpers";
import { createClient, getUser } from "@/lib/supabase/server";
import { getNotifications } from "@/lib/actions/notifications";
import { DUMMY_CONVERSATIONS } from "@/lib/data/messages";
import type { Conversation } from "@/types";

export const metadata: Metadata = { title: "Indbakke" };

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function IndbakkePage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const initialTab = tab === "notifikationer" ? "notifikationer" : "beskeder";

  let convs: Conversation[] = [];
  let myId = "user_me";
  const notifications = await (isSupabaseConfigured() ? getNotifications() : Promise.resolve([]));

  if (isSupabaseConfigured()) {
    const user = await getUser();
    if (user) {
      myId = user.id;
      const supabase = await createClient();

      const { data: rows } = await supabase
        .from("conversations")
        .select(`
          id, updated_at,
          products(id, title, brand, price, product_images(storage_path, position)),
          buyer:profiles!buyer_id(id, username, display_name, avatar_url, is_verified),
          seller:profiles!seller_id(id, username, display_name, avatar_url, is_verified),
          messages(id, sender_id, text, created_at, is_read)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      convs = (rows ?? []).map((r: any) => {
        const isBuyer     = r.buyer?.id === user.id;
        const participant = isBuyer ? r.seller : r.buyer;
        const msgs        = (r.messages ?? []).sort(
          (a: any, b: any) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        const unread = msgs.filter(
          (m: any) => !m.is_read && m.sender_id !== user.id,
        ).length;
        const images = r.products?.product_images ?? [];
        const cover  = images.sort((a: any, b: any) => a.position - b.position)[0];

        return {
          id:          r.id,
          updatedAt:   r.updated_at,
          unreadCount: unread,
          participant: {
            id:          participant?.id          ?? "",
            username:    participant?.username     ?? "anonym",
            displayName: participant?.display_name ?? participant?.username ?? "Anonym",
            avatarUrl:   participant?.avatar_url   ?? null,
            isVerified:  participant?.is_verified  ?? false,
          },
          product: {
            id:       r.products?.id    ?? "",
            title:    r.products?.title ?? "",
            brand:    r.products?.brand ?? "",
            price:    r.products?.price ?? 0,
            imageUrl: storageUrl(cover?.storage_path ?? null),
          },
          messages: msgs.map((m: any) => ({
            id:          m.id,
            senderId:    m.sender_id,
            text:        m.text,
            createdAt:   m.created_at,
            messageType: "text" as const,
          })),
        };
      });
    }
  } else {
    convs = [...DUMMY_CONVERSATIONS].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  return (
    <PageShell noFooter>
      <div className="max-w-[800px] mx-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-8 pb-4">
          <p className="font-mono text-2xs tracking-editorial text-ink-dim uppercase mb-1">
            NORD STUDIOS
          </p>
          <h1
            className="font-display font-semibold text-brown leading-none"
            style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.03em" }}
          >
            INDBAKKE
          </h1>
        </div>

        <InboxClient
          conversations={convs}
          notifications={notifications}
          myId={myId}
          initialTab={initialTab}
        />
      </div>
    </PageShell>
  );
}
