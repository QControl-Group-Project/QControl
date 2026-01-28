

import { createClient } from "@/lib/supabase/client";
import {
  RealtimeChannel,
  RealtimeChannelSendResponse,
  type RealtimePresenceState,
} from "@supabase/supabase-js";

export type ConnectionState = 
  | "connecting" 
  | "connected" 
  | "disconnected" 
  | "error";

export type PresenceState = RealtimePresenceState<{
  user_id?: string;
  user_name?: string;
  user_role?: string;
  online_at?: string;
  [key: string]: any;
}>;

export type BroadcastPayload = {
  event: string;
  type: string;
  payload: any;
};

export interface RealtimeClientConfig {
  channelName: string;
  enablePresence?: boolean;
  enableBroadcast?: boolean;
  presenceKey?: string;
  onConnectionChange?: (state: ConnectionState) => void;
  onError?: (error: Error) => void;
}

export class RealtimeClient {
  private channel: RealtimeChannel | null = null;
  private connectionState: ConnectionState = "disconnected";
  private presenceState: PresenceState = {};
  private config: RealtimeClientConfig;
  private supabase = createClient();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: RealtimeClientConfig) {
    this.config = config;
  }

     
  async connect(): Promise<void> {
    try {
      this.updateConnectionState("connecting");

      this.channel = this.supabase.channel(this.config.channelName, {
        config: {
          presence: {
            key: this.config.presenceKey || "default",
          },
          broadcast: {
            self: true,
          },
        },
      });

      const channel = this.channel;
      if (!channel) {
        throw new Error("Failed to initialize realtime channel.");
      }

      channel.subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          this.updateConnectionState("connected");
          this.reconnectAttempts = 0;
        } else if (status === "CHANNEL_ERROR") {
          this.updateConnectionState("error");
          this.handleReconnect();
          if (err) {
            this.config.onError?.(new Error(err.message || "Channel error"));
          }
        } else if (status === "TIMED_OUT") {
          this.updateConnectionState("disconnected");
          this.handleReconnect();
        } else if (status === "CLOSED") {
          this.updateConnectionState("disconnected");
        }
      });
    } catch (error) {
      this.updateConnectionState("error");
      this.config.onError?.(error as Error);
      throw error;
    }
  }


  trackPresence(presenceData: Record<string, any>): void {
    if (!this.channel) {
      throw new Error("Channel not initialized. Call connect() first.");
    }

    if (!this.config.enablePresence) {
      console.warn("Presence tracking is not enabled for this channel");
      return;
    }

    this.channel.track({
      ...presenceData,
      online_at: new Date().toISOString(),
    });
  }

  onPresence(callback: (presenceState: PresenceState) => void): void {
    if (!this.channel) {
      throw new Error("Channel not initialized. Call connect() first.");
    }

    this.channel
      .on("presence", { event: "sync" }, () => {
        const newState = this.channel!.presenceState() as PresenceState;
        this.presenceState = newState;
        callback(newState);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        callback(this.channel!.presenceState() as PresenceState);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        callback(this.channel!.presenceState() as PresenceState);
      });
  }

  async broadcast(
    event: string,
    payload: any
  ): Promise<RealtimeChannelSendResponse> {
    if (!this.channel) {
      throw new Error("Channel not initialized. Call connect() first.");
    }

    if (!this.config.enableBroadcast) {
      throw new Error("Broadcasting is not enabled for this channel");
    }

    return this.channel.send({
      type: "broadcast",
      event,
      payload,
    });
  }

  onBroadcast(event: string, callback: (payload: any) => void): void {
    if (!this.channel) {
      throw new Error("Channel not initialized. Call connect() first.");
    }

    this.channel.on("broadcast", { event }, ({ payload }) => {
      callback(payload);
    });
  }

  onDatabaseChange<T = any>(
    config: {
      event: "*" | "INSERT" | "UPDATE" | "DELETE";
      schema: string;
      table: string;
      filter?: string;
    },
    callback: (payload: {
      eventType: "INSERT" | "UPDATE" | "DELETE";
      new: T;
      old: T;
      errors: any;
    }) => void
  ): void {
    if (!this.channel) {
      throw new Error("Channel not initialized. Call connect() first.");
    }

    this.channel.on("postgres_changes", config as any, callback as any);
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getPresenceState(): PresenceState {
    return this.presenceState;
  }

  async untrack(): Promise<void> {
    if (this.channel) {
      await this.channel.untrack();
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.channel) {
      await this.supabase.removeChannel(this.channel);
      this.channel = null;
    }

    this.updateConnectionState("disconnected");
  }

  private updateConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.config.onConnectionChange?.(state);
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.disconnect().then(() => this.connect());
    }, delay);
  }
}

export function createRealtimeClient(
  config: RealtimeClientConfig
): RealtimeClient {
  return new RealtimeClient(config);
}

export function generateChannelName(
  prefix: string,
  identifier?: string
): string {
  const timestamp = Date.now();
  return identifier 
    ? `${prefix}_${identifier}_${timestamp}` 
    : `${prefix}_${timestamp}`;
}

