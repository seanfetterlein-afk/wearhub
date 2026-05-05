"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";

const items = [
  { label: "Hjem",     href: "/",         icon: Home,          center: false },
  { label: "Søg",      href: "/search",   icon: Search,        center: false },
  { label: "Sælg",     href: "/sell",     icon: Plus,          center: true  },
  { label: "Indbakke", href: "/messages", icon: MessageCircle, center: false },
  { label: "Profil",   href: "/profile",  icon: User,          center: false },
];

export function BottomNav() {
  const pathname              = usePathname();
  const [badge, setBadge]     = useState(0);
  const [pressed, setPressed] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<string | null>(null);

  // Clear optimistic selection once the real pathname catches up
  useEffect(() => {
    setOptimistic(null);
  }, [pathname]);

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
          const isActive = optimistic
            ? optimistic === href
            : href === "/" ? pathname === "/" : pathname.startsWith(href);
          const isPressed = pressed === href;
          const isInbox   = href === "/messages";

          return (
            <Link
              key={href}
              href={href}
              onPointerDown={() => { setPressed(href); setOptimistic(href); }}
              onPointerUp={() => setPressed(null)}
              onPointerLeave={() => setPressed(null)}
              onPointerCancel={() => setPressed(null)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 cursor-pointer select-none outline-none focus-visible:outline-none"
              style={{
                transform: isPressed ? "scale(0.94)" : "scale(1)",
                transition: "transform 80ms ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {center ? (
                <div
                  className="w-10 h-10 bg-black rounded-full flex items-center justify-center"
                  style={{
                    opacity: isPressed ? 0.75 : 1,
                    transition: "opacity 80ms ease",
                  }}
                >
                  <Icon size={18} className="text-white" strokeWidth={2.5} />
                </div>
              ) : (
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.2 : 1.5}
                    style={{
                      color: isActive || isPressed ? "#000000" : "#AAAAAA",
                      transition: "color 80ms ease, stroke-width 80ms ease",
                    }}
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
                style={{
                  color: isActive || isPressed ? "#000000" : "#AAAAAA",
                  fontWeight: isActive || isPressed ? 600 : 400,
                  transition: "color 80ms ease, font-weight 80ms ease",
                }}
                className="text-[10px] tracking-wide font-body"
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
