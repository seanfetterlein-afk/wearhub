"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { cn } from "@/lib/utils";

const items = [
  { label: "Hjem",     href: "/",         icon: Home,          center: false },
  { label: "Søg",      href: "/search",   icon: Search,        center: false },
  { label: "Sælg",     href: "/sell",     icon: Plus,          center: true  },
  { label: "Indbakke", href: "/messages", icon: MessageCircle, center: false },
  { label: "Profil",   href: "/profile",  icon: User,          center: false },
];

export function BottomNav() {
  const pathname    = usePathname();
  const [badge, setBadge] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let active = true;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || !active) return;

      const fetchCount = async () => {
        if (!active) return;
        const [{ count: msgCount }, { count: notifCount }] = await Promise.all([
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("is_read", false)
            .neq("sender_id", user.id),
          (supabase.from("notifications") as any)
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false),
        ]);
        if (active) setBadge((msgCount ?? 0) + (notifCount ?? 0));
      };

      await fetchCount();
      if (!active) return;

      channel = supabase
        .channel("inbox_badge")
        .on("postgres_changes", {
          event: "*", schema: "public", table: "messages",
        }, fetchCount)
        .on("postgres_changes", {
          event: "*", schema: "public", table: "notifications",
          filter: `user_id=eq.${user.id}`,
        }, fetchCount)
        .subscribe();
    });

    return () => {
      active = false;
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#EAEAEA] flex items-center"
      style={{ height: "64px", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="w-full flex items-center justify-around">
        {items.map(({ label, href, icon: Icon, center }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          const isInbox = href === "/messages";

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-opacity"
            >
              {center ? (
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                  <Icon size={18} className="text-white" strokeWidth={2.5} />
                </div>
              ) : (
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.2 : 1.5}
                    className={active ? "text-black" : "text-[#AAAAAA]"}
                  />
                  {isInbox && badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-red-500 rounded-full border border-white flex items-center justify-center px-0.5">
                      <span className="text-white font-mono leading-none" style={{ fontSize: 8 }}>
                        {badge > 9 ? "9+" : badge}
                      </span>
                    </span>
                  )}
                </div>
              )}
              <span
                className={cn(
                  "text-[10px] tracking-wide font-body",
                  center
                    ? "text-black font-medium"
                    : active
                      ? "text-black font-semibold"
                      : "text-[#AAAAAA] font-normal",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
