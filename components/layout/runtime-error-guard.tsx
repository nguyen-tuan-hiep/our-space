"use client";

import { useEffect } from "react";

export function RuntimeErrorGuard() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof Event) {
        event.preventDefault();
        console.warn(
          "Ignored non-error promise rejection event:",
          event.reason,
        );
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () =>
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
  }, []);

  return null;
}
