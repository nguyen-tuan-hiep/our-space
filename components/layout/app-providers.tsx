"use client";

import dynamic from "next/dynamic";
import { PerformanceLogger } from "@/components/layout/performance-logger";
import { RuntimeErrorGuard } from "@/components/layout/runtime-error-guard";
import { ToastProvider } from "@/components/toast";

const OneSignalBootstrap = dynamic(
  () =>
    import("@/components/notifications/onesignal-bootstrap").then(
      (mod) => mod.OneSignalBootstrap,
    ),
  { ssr: false },
);

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <RuntimeErrorGuard />
      <PerformanceLogger />
      <OneSignalBootstrap />
      {children}
    </ToastProvider>
  );
}
