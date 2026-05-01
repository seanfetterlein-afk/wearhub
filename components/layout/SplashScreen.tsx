"use client";

import { useEffect, useRef, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const KEY = "splash_v12";

    if (sessionStorage.getItem(KEY)) {
      setVisible(false);
      return;
    }

    const loadTime = performance.now();
    const duration = loadTime > 800 ? 5000 : 2000;
    sessionStorage.setItem(KEY, "1");

    const timer = setTimeout(() => {
      const el = ref.current;
      if (!el) { setVisible(false); return; }
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#ffffff");
      el.style.opacity = "0";
      el.addEventListener("transitionend", () => setVisible(false), { once: true });
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: 1,
        transition: "opacity 0.6s ease",
      }}
    >
      <img
        src="/logo.png"
        alt="WearHub"
        style={{ height: "7rem", width: "auto", display: "block" }}
      />

      <div style={{ position: "absolute", bottom: "4rem" }}>
        <div className="w-6 h-6 rounded-full border-2 border-black/20 border-t-black animate-spin" />
      </div>
    </div>
  );
}
