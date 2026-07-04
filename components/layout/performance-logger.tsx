"use client";

import { useEffect } from "react";

export function PerformanceLogger() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (typeof performance === "undefined") return;

    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;

    const logMetric = (label: string, value: number) => {
      console.info(`[perf] ${label}: ${Math.round(value)}ms`);
    };

    if (navigation) {
      logMetric("TTFB", navigation.responseStart);
      if (navigation.domContentLoadedEventEnd > 0) {
        logMetric("DOMContentLoaded", navigation.domContentLoadedEventEnd);
      }
      if (navigation.loadEventEnd > 0) {
        logMetric("load", navigation.loadEventEnd);
      } else {
        window.addEventListener(
          "load",
          () => {
            const updatedNavigation = performance.getEntriesByType(
              "navigation",
            )[0] as PerformanceNavigationTiming | undefined;
            if (updatedNavigation?.loadEventEnd) {
              logMetric("load", updatedNavigation.loadEventEnd);
            }
          },
          { once: true },
        );
      }
    }

    const paintObserver =
      "PerformanceObserver" in window
        ? new PerformanceObserver((list) => {
            const fcp = list
              .getEntries()
              .find((entry) => entry.name === "first-contentful-paint");
            if (fcp) logMetric("FCP", fcp.startTime);
          })
        : null;

    try {
      paintObserver?.observe({ type: "paint", buffered: true });
    } catch {
      // Older WebKit may not support buffered paint observation.
    }

    return () => paintObserver?.disconnect();
  }, []);

  return null;
}
