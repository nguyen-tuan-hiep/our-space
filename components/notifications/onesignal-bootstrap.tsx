"use client";

import { useEffect } from "react";
import { getOneSignal, isOneSignalConfigured } from "@/lib/onesignal-web";

export function OneSignalBootstrap() {
  useEffect(() => {
    if (!isOneSignalConfigured() || !("serviceWorker" in navigator)) return;

    void getOneSignal().catch((error) => {
      console.warn("OneSignal bootstrap failed", error);
    });
  }, []);

  return null;
}
