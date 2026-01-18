"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { QueueToken } from "@/lib/types";

export function QueueNotifications({ tokenId }: { tokenId: string }) {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("token_updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "queue_tokens",
          filter: `id=eq.${tokenId}`,
        },
        (payload: RealtimePostgresChangesPayload<QueueToken>) => {
          const updatedToken = payload.new as QueueToken | null;
          if (updatedToken?.status === "called") {
            toast.success("Your token has been called!", {
              duration: 10000,
            });
            // You can also trigger sound/vibration here
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tokenId]);

  return null;
}
