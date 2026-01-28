
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { QueueToken } from "@/lib/types";
import { useRealtimeBroadcast } from "./useRealtimeBroadcast";

export interface QueuePosition {
  tokenId: string;
  tokenNumber: number;
  currentPosition: number;
  totalWaiting: number;
  estimatedWaitMinutes: number;
  isNextUp: boolean;
  isCalled: boolean;
  isServing: boolean;
  peopleAhead: number;
}

export interface UseQueuePositionTrackingOptions {
  tokenId: string;
  queueId: string;
  onPositionChange?: (position: QueuePosition) => void;
  onTokenCalled?: () => void;
  onAlmostReady?: (peopleAhead: number) => void; 
  enableNotifications?: boolean;
}

export function useQueuePositionTracking(
  options: UseQueuePositionTrackingOptions
) {
  const [position, setPosition] = useState<QueuePosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    tokenId,
    queueId,
    onPositionChange,
    onTokenCalled,
    onAlmostReady,
    enableNotifications = true,
  } = options;

  const supabase = createClient();

  const { isConnected } = useRealtimeBroadcast({
    channelName: `queue_${queueId}_tracking`,
    events: ["token_called", "token_completed", "position_update"],
    onEvent: (event) => {
      if (event.event === "token_called" && event.payload.tokenId === tokenId) {
        onTokenCalled?.();
        if (enableNotifications && "Notification" in window && Notification.permission === "granted") {
          new Notification("Your Token is Called!", {
            body: "Please proceed to the counter immediately.",
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: "token-called",
            requireInteraction: true,
          });
        }
      }
      
      calculatePosition();
    },
  });

  const calculatePosition = useCallback(async () => {
    if (!tokenId || !queueId) return;

    try {
      const { data: currentToken, error: tokenError } = await supabase
        .from("queue_tokens")
        .select("*")
        .eq("id", tokenId)
        .single();

      if (tokenError || !currentToken) {
        setError("Token not found");
        setLoading(false);
        return;
      }

      const { data: queue } = await supabase
        .from("queues")
        .select("estimated_wait_time")
        .eq("id", queueId)
        .single();

      const estimatedWaitPerToken = queue?.estimated_wait_time || 5;

      if (currentToken.status === "called" || currentToken.status === "serving") {
        const pos: QueuePosition = {
          tokenId: currentToken.id,
          tokenNumber: currentToken.token_number,
          currentPosition: 0,
          totalWaiting: 0,
          estimatedWaitMinutes: 0,
          isNextUp: false,
          isCalled: currentToken.status === "called",
          isServing: currentToken.status === "serving",
          peopleAhead: 0,
        };
        setPosition(pos);
        onPositionChange?.(pos);
        setLoading(false);
        return;
      }

      if (["served", "cancelled", "skipped"].includes(currentToken.status)) {
        setError("Token is no longer active");
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: tokensAhead, error: aheadError } = await supabase
        .from("queue_tokens")
        .select("id, token_number, priority, status")
        .eq("queue_id", queueId)
        .gte("created_at", today)
        .eq("status", "waiting")
        .or(
          `priority.gt.${currentToken.priority},and(priority.eq.${currentToken.priority},token_number.lt.${currentToken.token_number})`
        );

      if (aheadError) {
        console.error("Error fetching tokens ahead:", aheadError);
      }

      const peopleAhead = tokensAhead?.length || 0;
      const currentPosition = peopleAhead + 1;

      const { count: totalWaiting } = await supabase
        .from("queue_tokens")
        .select("*", { count: "exact", head: true })
        .eq("queue_id", queueId)
        .gte("created_at", today)
        .eq("status", "waiting");

      const estimatedWaitMinutes = peopleAhead * estimatedWaitPerToken;
      const isNextUp = peopleAhead === 0;

      const pos: QueuePosition = {
        tokenId: currentToken.id,
        tokenNumber: currentToken.token_number,
        currentPosition,
        totalWaiting: totalWaiting || 0,
        estimatedWaitMinutes,
        isNextUp,
        isCalled: false,
        isServing: false,
        peopleAhead,
      };

      setPosition(pos);
      onPositionChange?.(pos);

      if (peopleAhead <= 2 && peopleAhead > 0 && enableNotifications) {
        onAlmostReady?.(peopleAhead);
      }

      setError(null);
      setLoading(false);
    } catch (err) {
      console.error("Error calculating position:", err);
      setError("Failed to calculate position");
      setLoading(false);
    }
  }, [tokenId, queueId, supabase, onPositionChange, onAlmostReady, enableNotifications]);

  useEffect(() => {
    if (!queueId || !tokenId) return;

    calculatePosition();

    const channel = supabase
      .channel(`queue_position_${tokenId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_tokens",
          filter: `queue_id=eq.${queueId}`,
        },
        () => {
          calculatePosition();
        }
      )
      .subscribe();

    const interval = setInterval(calculatePosition, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [queueId, tokenId, supabase, calculatePosition]);

  return {
    position,
    loading,
    error,
    isConnected,
    refresh: calculatePosition,
  };
}

export function useMultipleTokensTracking(queueId: string) {
  const [positions, setPositions] = useState<Record<string, QueuePosition>>({});
  const supabase = createClient();

  const updatePositions = useCallback(async () => {
    if (!queueId) return;

    const today = new Date().toISOString().split("T")[0];
    const { data: tokens } = await supabase
      .from("queue_tokens")
      .select("*")
      .eq("queue_id", queueId)
      .gte("created_at", today)
      .eq("status", "waiting")
      .order("priority", { ascending: false })
      .order("token_number", { ascending: true });

    if (!tokens) return;

    const newPositions: Record<string, QueuePosition> = {};
    
    tokens.forEach((token: QueueToken, index: number) => {
      newPositions[token.id] = {
        tokenId: token.id,
        tokenNumber: token.token_number,
        currentPosition: index + 1,
        totalWaiting: tokens.length,
        estimatedWaitMinutes: index * 5, 
        isNextUp: index === 0,
        isCalled: false,
        isServing: false,
        peopleAhead: index,
      };
    });

    setPositions(newPositions);
  }, [queueId, supabase]);

  useEffect(() => {
    updatePositions();

    const channel = supabase
      .channel(`queue_positions_${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_tokens",
          filter: `queue_id=eq.${queueId}`,
        },
        updatePositions
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queueId, supabase, updatePositions]);

  return { positions, refresh: updatePositions };
}
