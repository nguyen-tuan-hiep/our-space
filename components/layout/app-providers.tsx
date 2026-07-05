"use client";

import { PerformanceLogger } from "@/components/layout/performance-logger";
import { RuntimeErrorGuard } from "@/components/layout/runtime-error-guard";
import { ToastProvider } from "@/components/toast";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <RuntimeErrorGuard />
      <PerformanceLogger />
      {children}
    </ToastProvider>
  );
}
