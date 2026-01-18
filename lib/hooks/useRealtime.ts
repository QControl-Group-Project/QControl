"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  RealtimeChannel,
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

export function useRealtime(
  table: string,
  callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
  filter?: string
) {
  const supabase = createClient();

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupChannel = () => {
      channel = supabase.channel(`${table}_changes`);

      const config: RealtimePostgresChangesFilter<"*"> = {
        event: "*",
        schema: "public",
        table,
      };

      if (filter) {
        config.filter = filter;
      }

      channel.on("postgres_changes", config, callback).subscribe();
    };

    setupChannel();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, filter]);
}
