
"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { RealtimeClient, ConnectionState } from "@/lib/supabase/realtime-client";

export interface BroadcastEvent {
  event: string;
  payload: any;
  timestamp: string;
  sender_id?: string;
}

export interface UseRealtimeBroadcastOptions {
  channelName: string;
  events: string[]; 
  onEvent?: (event: BroadcastEvent) => void;
  autoConnect?: boolean;
}

export interface UseRealtimeBroadcastReturn {
  broadcast: (event: string, payload: any, senderId?: string) => Promise<void>;
  connectionState: ConnectionState;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useRealtimeBroadcast(
  options: UseRealtimeBroadcastOptions
): UseRealtimeBroadcastReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const clientRef = useRef<RealtimeClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { channelName, events, onEvent, autoConnect = true } = options;

  useEffect(() => {
    const client = new RealtimeClient({
      channelName: `broadcast_${channelName}`,
      enableBroadcast: true,
      onConnectionChange: setConnectionState,
      onError: (error) => {
        console.error("Broadcast error:", error);
      },
    });

    clientRef.current = client;

    return () => {
      client.disconnect();
    };
  }, [channelName]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client || !isInitialized) return;

    events.forEach((eventName) => {
      client.onBroadcast(eventName, (payload) => {
        onEvent?.({
          event: eventName,
          payload,
          timestamp: new Date().toISOString(),
        });
      });
    });
  }, [events, onEvent, isInitialized]);

  const connect = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;

    try {
      await client.connect();
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to connect broadcast channel:", error);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;

    try {
      await client.disconnect();
      setIsInitialized(false);
    } catch (error) {
      console.error("Failed to disconnect broadcast channel:", error);
    }
  }, []);

  const broadcast = useCallback(
    async (event: string, payload: any, senderId?: string) => {
      const client = clientRef.current;
      if (!client) {
        throw new Error("Broadcast client not initialized");
      }

      try {
        await client.broadcast(event, {
          ...payload,
          sender_id: senderId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to broadcast event:", error);
        throw error;
      }
    },
    []
  );

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (isInitialized) {
        disconnect();
      }
    };
  }, [autoConnect]); 

  return {
    broadcast,
    connectionState,
    isConnected: connectionState === "connected",
    connect,
    disconnect,
  };
}

export function useQueueBroadcast(queueId: string) {
  return useRealtimeBroadcast({
    channelName: `queue_${queueId}`,
    events: [
      "token_called",
      "token_serving",
      "token_completed",
      "queue_status_changed",
      "emergency_alert",
    ],
    onEvent: (event) => {
      console.log("Queue event:", event);
    },
  });
}

export function useAppointmentBroadcast(businessId: string) {
  return useRealtimeBroadcast({
    channelName: `appointments_${businessId}`,
    events: [
      "appointment_approved",
      "appointment_rejected",
      "appointment_cancelled",
      "appointment_started",
      "appointment_completed",
      "appointment_reminder",
    ],
    onEvent: (event) => {
      console.log("Appointment event:", event);
    },
  });
}

