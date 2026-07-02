"use client";

import { RuntimeErrorGuard } from "@/components/layout/runtime-error-guard";
import { ToastProvider } from "@/components/toast";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <RuntimeErrorGuard />
      {children}
    </ToastProvider>
  );
}
