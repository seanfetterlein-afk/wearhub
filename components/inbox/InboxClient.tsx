"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle, Heart, Tag, Check, X,
  TrendingDown, Bell, ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";
import type { AppNotification, NotificationType } from "@/lib/actions/notifications";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "nu";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}t`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d`;
  return new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

const NOTIF_ICON: Record<NotificationType, React.ReactNode> = {
  message:              <MessageCircle size={15} className="text-ink-mid" />,
  offer_received:       <Tag           size={15} className="text-amber-600" />,
  offer_accepted:       <Check         size={15} className="text-green-600" />,
  offer_rejected:       <X             size={15} className="text-red-500" />,
  listing_favorited:    <Heart         size={15} className="text-red-500" />,
  favorite_price_drop:  <TrendingDown  size={15} className="text-green-600" />,
  system:               <Bell          size={15} className="text-ink-dim" />,
};

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabBtn({
  label, active, unread, onClick,
}: {
  label: string; active: boolean; unread: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 py-3 font-mono text-[10px] tracking-widest uppercase relative transition-colors",
        active ? "text-ink border-b-2 border-black" : "text-ink-dim border-b border-brown/15",
      )}
    >
      {label}
      {unread > 0 && (
        <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-black text-white font-mono text-[8px] rounded-full">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}

// ─── Conversation row ─────────────────────────────────────────────────────────

function ConvRow({ conv, myId }: { conv: Conversation; myId: string }) {
  const last     = conv.messages[conv.messages.length - 1];
  const isUnread = conv.unreadCount > 0;

  return (
    <Link
      href={`/messages/${conv.id}`}
      className="flex items-center gap-3 py-3.5 px-4 hover:bg-cream-deep/60 transition-colors active:bg-cream-deep"
    >
      {/* Avatar + unread dot */}
      <div className="relative shrink-0">
        <Avatar name={conv.participant.displayName} size="md" />
        {isUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-paper" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <span className={cn(
            "font-body text-[13px] truncate",
            isUnread ? "font-semibold text-ink" : "font-medium text-ink-mid",
          )}>
            {conv.participant.displayName}
          </span>
          {conv.participant.isVerified && (
            <ShieldCheck size={10} className="text-brown shrink-0" />
          )}
        </div>
        <p className={cn(
          "text-[12px] truncate",
          isUnread ? "text-ink font-medium" : "text-ink-dim",
        )}>
          {last?.senderId === myId ? "Du: " : ""}
          {last?.text ?? "Ingen beskeder endnu"}
        </p>
        <p className="font-mono text-[9px] text-ink-dim mt-0.5 truncate">
          {conv.product.brand} — {conv.product.title}
        </p>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="font-mono text-[9px] text-ink-dim">{timeAgo(conv.updatedAt)}</span>
        {conv.product.imageUrl && (
          <div className="w-9 h-9 bg-cream-deep border border-brown/12 overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={conv.product.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotifRow({
  notif,
  onRead,
}: {
  notif: AppNotification;
  onRead: (id: string, conversationId: string | null, listingId: string | null) => void;
}) {
  return (
    <button
      onClick={() => onRead(notif.id, notif.conversationId, notif.listingId)}
      className={cn(
        "w-full flex items-center gap-3 py-3.5 px-4 text-left transition-colors hover:bg-cream-deep/60 active:bg-cream-deep",
        !notif.isRead && "bg-cream-deep/40",
      )}
    >
      {/* Icon circle */}
      <div className="w-9 h-9 rounded-full bg-cream border border-brown/15 flex items-center justify-center shrink-0">
        {NOTIF_ICON[notif.type] ?? NOTIF_ICON.system}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-[13px] text-ink leading-snug",
          !notif.isRead ? "font-semibold" : "font-normal",
        )}>
          {notif.title}
        </p>
        <p className="text-[11px] text-ink-dim mt-0.5 line-clamp-2 leading-relaxed">
          {notif.body}
        </p>
        <p className="font-mono text-[9px] text-ink-dim mt-1">{timeAgo(notif.createdAt)}</p>
      </div>

      {/* Listing thumbnail */}
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        {notif.listingImageUrl ? (
          <div className="w-9 h-9 bg-cream-deep border border-brown/12 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={notif.listingImageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-9 h-9" />
        )}
        {!notif.isRead && (
          <span className="w-2 h-2 bg-red-500 rounded-full" />
        )}
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  conversations:   Conversation[];
  notifications:   AppNotification[];
  myId:            string;
  initialTab:      "beskeder" | "notifikationer";
}

export function InboxClient({ conversations, notifications, myId, initialTab }: Props) {
  const router = useRouter();
  const [tab,   setTab]   = useState<"beskeder" | "notifikationer">(initialTab);
  const [notifs, setNotifs] = useState<AppNotification[]>(notifications);
  const [, startTransition] = useTransition();

  const unreadMessages     = conversations.reduce((s, c) => s + c.unreadCount, 0);
  const unreadNotifications = notifs.filter((n) => !n.isRead).length;

  const handleRead = (
    id: string,
    conversationId: string | null,
    listingId: string | null,
  ) => {
    // Optimistic mark-as-read
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    startTransition(() => { markNotificationRead(id); });

    if (conversationId) {
      router.push(`/messages/${conversationId}`);
    } else if (listingId) {
      router.push(`/item/${listingId}`);
    }
  };

  const handleMarkAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    startTransition(() => { markAllNotificationsRead(); });
  };

  return (
    <>
      {/* ── Tabs ── */}
      <div className="flex border-b border-brown/15">
        <TabBtn
          label="Beskeder"
          active={tab === "beskeder"}
          unread={unreadMessages}
          onClick={() => setTab("beskeder")}
        />
        <TabBtn
          label="Notifikationer"
          active={tab === "notifikationer"}
          unread={unreadNotifications}
          onClick={() => setTab("notifikationer")}
        />
      </div>

      {/* ── Beskeder tab ── */}
      {tab === "beskeder" && (
        <div className="divide-y divide-brown/8">
          {conversations.length === 0 ? (
            <div className="py-20 text-center">
              <MessageCircle size={28} className="text-ink-dim mx-auto mb-3" strokeWidth={1.5} />
              <p className="font-mono text-[10px] tracking-widest text-ink-dim uppercase">
                Ingen beskeder endnu
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConvRow key={conv.id} conv={conv} myId={myId} />
            ))
          )}
        </div>
      )}

      {/* ── Notifikationer tab ── */}
      {tab === "notifikationer" && (
        <>
          {unreadNotifications > 0 && (
            <div className="px-4 py-2 flex justify-end border-b border-brown/8">
              <button
                onClick={handleMarkAllRead}
                className="font-mono text-[9px] tracking-widest text-ink-dim uppercase hover:text-ink transition-colors"
              >
                Marker alle som læst
              </button>
            </div>
          )}

          <div className="divide-y divide-brown/8">
            {notifs.length === 0 ? (
              <div className="py-20 text-center">
                <Bell size={28} className="text-ink-dim mx-auto mb-3" strokeWidth={1.5} />
                <p className="font-mono text-[10px] tracking-widest text-ink-dim uppercase">
                  Ingen notifikationer endnu
                </p>
              </div>
            ) : (
              notifs.map((n) => (
                <NotifRow key={n.id} notif={n} onRead={handleRead} />
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}
