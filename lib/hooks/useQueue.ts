"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Queue, QueueToken, QueueStats } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

export function useQueue(queueId: string) {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  const loadQueue = async () => {
    const { data, error } = await supabase
      .from("queues")
      .select("*, hospitals(name), departments(name)")
      .eq("id", queueId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load queue",
        variant: "destructive",
      });
    } else {
      setQueue(data);
    }
  };

  const loadTokens = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("queue_tokens")
      .select("*")
      .eq("queue_id", queueId)
      .gte("created_at", today)
      .order("token_number", { ascending: true });

    if (error) {
      console.error("Error loading tokens:", error);
    } else {
      setTokens((data as QueueToken[]) || []);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const { data, error } = await supabase
      .rpc("get_queue_stats", { p_queue_id: queueId })
      .single();

    if (!error && data) {
      setStats(data as QueueStats);
    }
  };

  useEffect(() => {
    if (!queueId) return;

    loadQueue();
    loadTokens();
    loadStats();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`queue_${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_tokens",
          filter: `queue_id=eq.${queueId}`,
        },
        () => {
          loadTokens();
          loadStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueId]);

  const callToken = async (tokenId: string) => {
    const { error } = await supabase
      .from("queue_tokens")
      .update({
        status: "called",
        called_at: new Date().toISOString(),
      })
      .eq("id", tokenId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to call token",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Token called successfully",
      });
    }
  };

  const startServing = async (tokenId: string) => {
    const { error } = await supabase
      .from("queue_tokens")
      .update({
        status: "serving",
        serving_started_at: new Date().toISOString(),
      })
      .eq("id", tokenId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start serving",
        variant: "destructive",
      });
    }
  };

  const completeToken = async (tokenId: string) => {
    const { error } = await supabase
      .from("queue_tokens")
      .update({
        status: "served",
        completed_at: new Date().toISOString(),
      })
      .eq("id", tokenId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to complete token",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Token completed successfully",
      });
    }
  };

  const skipToken = async (tokenId: string) => {
    const { error } = await supabase
      .from("queue_tokens")
      .update({ status: "skipped" })
      .eq("id", tokenId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to skip token",
        variant: "destructive",
      });
    }
  };

  return {
    queue,
    tokens,
    stats,
    loading,
    callToken,
    startServing,
    completeToken,
    skipToken,
    reload: loadTokens,
  };
}
