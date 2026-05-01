"use client";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { NotificationPrompt } from "@/components/layout/NotificationPrompt";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <SplashScreen />
      {children}
      <NotificationPrompt />
    </LanguageProvider>
  );
}
