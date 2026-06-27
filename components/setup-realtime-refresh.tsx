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
        { event: "*", schema: "public", table: "pairing_requests" },
        (payload) => {
          const record = payload.new as
            | { requester_id?: string; recipient_id?: string }
            | undefined;
          const oldRecord = payload.old as
            | { requester_id?: string; recipient_id?: string }
            | undefined;
          const related =
            record?.requester_id === profileId ||
            record?.recipient_id === profileId ||
            oldRecord?.requester_id === profileId ||
            oldRecord?.recipient_id === profileId;

          if (related) router.refresh();
        },
      )
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
