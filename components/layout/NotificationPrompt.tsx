"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveSubscription } from "@/lib/actions/push";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

async function subscribeToPush() {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub = existing ?? (await reg.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  }));

  const json = sub.toJSON();
  await saveSubscription({
    endpoint: json.endpoint!,
    keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
  });
}

export function NotificationPrompt() {
  const [show,      setShow]      = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Register service worker silently
    navigator.serviceWorker.register("/sw.js").catch(() => {});

    const permission = Notification.permission;

    // Already granted — subscribe silently without prompting
    if (permission === "granted") {
      subscribeToPush().catch(() => {});
      return;
    }

    if (permission === "denied") return;
    if (sessionStorage.getItem("push_dismissed")) return;

    // Show prompt only to logged-in users
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setTimeout(() => setShow(true), 4000);
    });
  }, []);

  const handleEnable = async () => {
    setShow(false);
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      subscribeToPush().catch(() => {});
    }
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem("push_dismissed", "1");
    setDismissed(true);
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 bg-paper border border-brown/25 shadow-xl p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-brown flex items-center justify-center shrink-0">
          <Bell size={15} className="text-cream" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body font-semibold text-ink text-sm leading-tight mb-0.5">
            Aktiver notifikationer
          </p>
          <p className="font-body text-xs text-ink-mid leading-relaxed">
            Få besked når du modtager bud eller beskeder.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-ink-dim hover:text-ink transition-colors shrink-0 mt-0.5"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleEnable}
          className="flex-1 h-9 bg-brown text-cream font-mono text-[9px] tracking-widest uppercase hover:bg-brown-deep transition-colors"
        >
          AKTIVER
        </button>
        <button
          onClick={handleDismiss}
          className="flex-1 h-9 border border-brown/20 font-mono text-[9px] tracking-widest text-ink-mid uppercase hover:border-brown hover:text-brown transition-colors"
        >
          IKKE NU
        </button>
      </div>
    </div>
  );
}
