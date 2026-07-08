"use client";

import { PerformanceLogger } from "@/components/layout/performance-logger";
import { RuntimeErrorGuard } from "@/components/layout/runtime-error-guard";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/toast";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <RuntimeErrorGuard />
        <PerformanceLogger />
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
