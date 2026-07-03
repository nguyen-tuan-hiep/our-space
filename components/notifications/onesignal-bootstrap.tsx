"use client";

import { useEffect } from "react";
import { getOneSignal, isOneSignalConfigured } from "@/lib/onesignal-web";

const ONESIGNAL_BOOT_DELAY_MS = 3000;

export function OneSignalBootstrap() {
  useEffect(() => {
    if (!isOneSignalConfigured()) return;
    if (!("serviceWorker" in navigator)) return;

    const timer = window.setTimeout(() => {
      void getOneSignal().catch((error) => {
        console.warn("OneSignal bootstrap failed", error);
      });
    }, ONESIGNAL_BOOT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}