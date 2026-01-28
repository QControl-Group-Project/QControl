"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Queue, QueueToken, QueueStats, QueueTokenStatus } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  REALTIME_CHANNEL_STATES,
} from "@supabase/supabase-js";

export interface RealtimeQueueState {
  queue: Queue | null;
  tokens: QueueToken[];
  stats: QueueStats | null;
  currentServingToken: QueueToken | null;
  nextToken: QueueToken | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

export interface RealtimeQueueActions {
  callToken: (tokenId: string) => Promise<void>;
  startServing: (tokenId: string) => Promise<void>;
  completeToken: (tokenId: string) => Promise<void>;
  skipToken: (tokenId: string) => Promise<void>;
  cancelToken: (tokenId: string, reason?: string) => Promise<void>;
  recallToken: (tokenId: string) => Promise<void>;
  toggleQueueStatus: (isActive: boolean) => Promise<void>;
  reload: () => Promise<void>;
}

export type TokenChangeEvent = "INSERT" | "UPDATE" | "DELETE";

export interface TokenChangePayload {
  event: TokenChangeEvent;
  token: QueueToken;
  oldToken?: QueueToken;
}

interface UseRealtimeQueueOptions {
  onTokenChange?: (payload: TokenChangePayload) => void;
  onQueueStatusChange?: (isActive: boolean) => void;
  onTokenCalled?: (token: QueueToken) => void;
  autoRefreshStats?: boolean;
}

export function useRealtimeQueue(
  queueId: string,
  options: UseRealtimeQueueOptions = {}
): RealtimeQueueState & RealtimeQueueActions {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const queueChannelRef = useRef<RealtimeChannel | null>(null);
  type RealtimeChannelState =
    (typeof REALTIME_CHANNEL_STATES)[keyof typeof REALTIME_CHANNEL_STATES];

  const { autoRefreshStats = true } = options;
  const onTokenChangeRef = useRef(options.onTokenChange);
  const onQueueStatusChangeRef = useRef(options.onQueueStatusChange);
  const onTokenCalledRef = useRef(options.onTokenCalled);

  useEffect(() => {
    onTokenChangeRef.current = options.onTokenChange;
    onQueueStatusChangeRef.current = options.onQueueStatusChange;
    onTokenCalledRef.current = options.onTokenCalled;
  }, [options.onTokenChange, options.onQueueStatusChange, options.onTokenCalled]);

  const currentServingToken = tokens.find(t => t.status === "serving") || null;
  
  const nextToken = tokens
    .filter(t => t.status === "waiting")
    .sort((a, b) => a.token_number - b.token_number)[0] || null;

  const loadQueue = useCallback(async () => {
    if (!queueId) return;

    const { data, error: queryError } = await supabase
      .from("queues")
      .select("*, businesses(name), departments(name)")
      .eq("id", queueId)
      .single();

    if (queryError) {
      setError("Failed to load queue");
      console.error("Error loading queue:", queryError);
    } else {
      setQueue(data);
      setError(null);
    }
  }, [queueId, supabase]);

  const loadTokens = useCallback(async () => {
    if (!queueId) return;

    const today = new Date().toISOString().split("T")[0];
    const { data, error: queryError } = await supabase
      .from("queue_tokens")
      .select("*")
      .eq("queue_id", queueId)
      .gte("created_at", today)
      .order("priority", { ascending: false })
      .order("token_number", { ascending: true });

    if (queryError) {
      console.error("Error loading tokens:", queryError);
    } else {
      setTokens((data as QueueToken[]) || []);
    }
    setLoading(false);
  }, [queueId, supabase]);

  const loadStats = useCallback(async () => {
    if (!queueId) return;

    const { data, error: queryError } = await supabase
      .rpc("get_queue_stats", { p_queue_id: queueId })
      .single();

    if (!queryError && data) {
      setStats(data as QueueStats);
    }
  }, [queueId, supabase]);

  const reload = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      }
      await Promise.all([loadQueue(), loadTokens(), loadStats()]);
      setLoading(false);
    },
    [loadQueue, loadTokens, loadStats]
  );

  const handleTokenChange = useCallback((
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => {
    const event = payload.eventType as TokenChangeEvent;
    const newToken = payload.new as unknown as QueueToken;
    const oldToken = payload.old as unknown as QueueToken;

    if (event === "INSERT") {
      setTokens(prev => [...prev, newToken].sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.token_number - b.token_number;
      }));
    } else if (event === "UPDATE") {
      setTokens(prev => prev.map(t => t.id === newToken.id ? newToken : t));
      
      if (oldToken?.status === "waiting" && newToken.status === "called") {
        onTokenCalledRef.current?.(newToken);
      }
    } else if (event === "DELETE") {
      setTokens(prev => prev.filter(t => t.id !== oldToken.id));
    }

    onTokenChangeRef.current?.({ event, token: newToken || oldToken, oldToken });

    if (autoRefreshStats) {
      loadStats();
    }
  }, [autoRefreshStats, loadStats]);

  const handleQueueChange = useCallback((
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => {
    const newQueue = payload.new as unknown as Queue;
    setQueue(newQueue);
    
    if (payload.old && (payload.old as Queue).is_active !== newQueue.is_active) {
      onQueueStatusChangeRef.current?.(newQueue.is_active);
    }
  }, []);

  useEffect(() => {
    if (!queueId) return;

    reload(true);

    channelRef.current = supabase
      .channel(`queue_tokens_${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_tokens",
          filter: `queue_id=eq.${queueId}`,
        },
        handleTokenChange
      )
      .subscribe((status: RealtimeChannelState) => {
        setIsConnected(status === REALTIME_CHANNEL_STATES.joined);
      });

    queueChannelRef.current = supabase
      .channel(`queue_status_${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "queues",
          filter: `id=eq.${queueId}`,
        },
        handleQueueChange
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (queueChannelRef.current) {
        supabase.removeChannel(queueChannelRef.current);
      }
    };
  }, [queueId, supabase, reload, handleTokenChange, handleQueueChange]);

  const callToken = useCallback(async (tokenId: string) => {
    const { error: updateError } = await supabase
      .from("queue_tokens")
      .update({
        status: "called" as QueueTokenStatus,
        called_at: new Date().toISOString(),
      })
      .eq("id", tokenId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to call token",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Token Called",
        description: "Patient has been notified",
      });
    }
  }, [supabase, toast]);

  const startServing = useCallback(async (tokenId: string) => {
    const { error: updateError } = await supabase
      .from("queue_tokens")
      .update({
        status: "serving" as QueueTokenStatus,
        serving_started_at: new Date().toISOString(),
      })
      .eq("id", tokenId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to start serving",
        variant: "destructive",
      });
    }
  }, [supabase, toast]);

  const completeToken = useCallback(async (tokenId: string) => {
    const { error: updateError } = await supabase
      .from("queue_tokens")
      .update({
        status: "served" as QueueTokenStatus,
        completed_at: new Date().toISOString(),
      })
      .eq("id", tokenId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to complete token",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Completed",
        description: "Token marked as served",
      });
    }
  }, [supabase, toast]);

  const skipToken = useCallback(async (tokenId: string) => {
    const { error: updateError } = await supabase
      .from("queue_tokens")
      .update({ status: "skipped" as QueueTokenStatus })
      .eq("id", tokenId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to skip token",
        variant: "destructive",
      });
    }
  }, [supabase, toast]);

  const cancelToken = useCallback(async (tokenId: string, reason?: string) => {
    const updateData: Partial<QueueToken> = { 
      status: "cancelled" as QueueTokenStatus 
    };
    
    const { error: updateError } = await supabase
      .from("queue_tokens")
      .update(updateData)
      .eq("id", tokenId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to cancel token",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cancelled",
        description: reason ? `Token cancelled: ${reason}` : "Token has been cancelled",
      });
    }
  }, [supabase, toast]);

  const recallToken = useCallback(async (tokenId: string) => {
    const { error: updateError } = await supabase
      .from("queue_tokens")
      .update({
        status: "called" as QueueTokenStatus,
        called_at: new Date().toISOString(),
      })
      .eq("id", tokenId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to recall token",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Token Recalled",
        description: "Patient has been notified again",
      });
    }
  }, [supabase, toast]);

  const toggleQueueStatus = useCallback(async (isActive: boolean) => {
    if (!queueId) return;

    const { error: updateError } = await supabase
      .from("queues")
      .update({ is_active: isActive })
      .eq("id", queueId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to update queue status",
        variant: "destructive",
      });
    } else {
      toast({
        title: isActive ? "Queue Opened" : "Queue Closed",
        description: isActive ? "Queue is now accepting tokens" : "Queue is now closed",
      });
    }
  }, [queueId, supabase, toast]);

  return {
    queue,
    tokens,
    stats,
    currentServingToken,
    nextToken,
    loading,
    error,
    isConnected,
    callToken,
    startServing,
    completeToken,
    skipToken,
    cancelToken,
    recallToken,
    toggleQueueStatus,
    reload,
  };
}

