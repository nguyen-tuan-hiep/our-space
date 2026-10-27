"use client";

import { PerformanceLogger } from "@/components/layout/performance-logger";
import { RuntimeErrorGuard } from "@/components/layout/runtime-error-guard";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/feedback/toast";
import { SaveCelebration } from "@/components/common/save-celebration";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <RuntimeErrorGuard />
        <PerformanceLogger />
        {children}
        <SaveCelebration />
      </ToastProvider>
    </ThemeProvider>
  );
}
