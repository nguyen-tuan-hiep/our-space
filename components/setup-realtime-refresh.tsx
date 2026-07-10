"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

interface SetupRealtimeRefreshProps {
  profileId: string;
}

export function SetupRealtimeRefresh({ profileId }: SetupRealtimeRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`setup-${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profileId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    const refreshInterval = window.setInterval(() => router.refresh(), 15000);

    return () => {
      window.clearInterval(refreshInterval);
      void supabase.removeChannel(channel);
    };
  }, [profileId, router]);

  return null;
}
