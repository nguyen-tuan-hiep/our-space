"use client";

import { RuntimeErrorGuard } from "@/components/layout/runtime-error-guard";
import { OneSignalBootstrap } from "@/components/notifications/onesignal-bootstrap";
import { ToastProvider } from "@/components/toast";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <RuntimeErrorGuard />
      <OneSignalBootstrap />
      {children}
    </ToastProvider>
  );
}
