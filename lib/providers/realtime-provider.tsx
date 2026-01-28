

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { 
  useRealtimePresence, 
  PresenceUser 
} from "@/lib/hooks/useRealtimePresence";
import { 
  useRealtimeBroadcast, 
  BroadcastEvent 
} from "@/lib/hooks/useRealtimeBroadcast";
import { useToast } from "@/components/ui/use-toast";

export interface RealtimeNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

interface RealtimeContextValue {
  
  onlineUsers: PresenceUser[];
  totalOnlineUsers: number;
  isUserOnline: boolean;
  
  
  broadcast: (event: string, payload: any) => Promise<void>;
  isConnected: boolean;
  
  
  notifications: RealtimeNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtimeContext must be used within RealtimeProvider");
  }
  return context;
}

interface RealtimeProviderProps {
  children: React.ReactNode;
  enablePresence?: boolean;
  enableBroadcast?: boolean;
  enableNotifications?: boolean;
}

export function RealtimeProvider({
  children,
  enablePresence = true,
  enableBroadcast = true,
  enableNotifications = true,
}: RealtimeProviderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);

  
  const {
    presenceUsers,
    totalUsers,
    isOnline,
    updatePresence,
  } = useRealtimePresence({
    channelName: "global_presence",
    userInfo: {
      user_id: user?.id || "anonymous",
      user_name: user?.user_metadata?.full_name || "Anonymous",
      user_role: user?.user_metadata?.role || "guest",
    },
    onUserJoin: (newUser) => {
      if (enableNotifications && user?.id && newUser.user_id !== user.id) {
        addNotification({
          type: "info",
          title: "User Joined",
          message: `${newUser.user_name || "Someone"} is now online`,
          data: newUser,
        });
      }
    },
    onUserLeave: (leftUser) => {
      if (enableNotifications && user?.id && leftUser.user_id !== user.id) {
        addNotification({
          type: "info",
          title: "User Left",
          message: `${leftUser.user_name || "Someone"} went offline`,
          data: leftUser,
        });
      }
    },
    autoTrack: enablePresence && !!user,
  });

  
  const { broadcast, isConnected } = useRealtimeBroadcast({
    channelName: "global_events",
    events: [
      "notification",
      "queue_update",
      "appointment_update",
      "alert",
      "announcement",
    ],
    onEvent: handleBroadcastEvent,
    autoConnect: enableBroadcast && !!user,
  });

  
  function handleBroadcastEvent(event: BroadcastEvent) {
    if (!enableNotifications) return;

    switch (event.event) {
      case "notification":
        addNotification({
          type: event.payload.type || "info",
          title: event.payload.title,
          message: event.payload.message,
          data: event.payload.data,
        });
        break;

      case "queue_update":
        if (event.payload.notify) {
          toast({
            title: "Queue Update",
            description: event.payload.message,
          });
        }
        addNotification({
          type: "info",
          title: "Queue Update",
          message: event.payload.message,
          data: event.payload,
        });
        break;

      case "appointment_update":
        if (event.payload.userId === user?.id) {
          toast({
            title: "Appointment Update",
            description: event.payload.message,
          });
          addNotification({
            type: event.payload.type || "info",
            title: "Appointment Update",
            message: event.payload.message,
            data: event.payload,
          });
        }
        break;

      case "alert":
        toast({
          title: event.payload.title || "Alert",
          description: event.payload.message,
          variant: event.payload.variant || "default",
        });
        addNotification({
          type: "warning",
          title: event.payload.title || "Alert",
          message: event.payload.message,
          data: event.payload,
        });
        break;

      case "announcement":
        toast({
          title: "📢 Announcement",
          description: event.payload.message,
        });
        addNotification({
          type: "info",
          title: "Announcement",
          message: event.payload.message,
          data: event.payload,
        });
        break;

      default:
        console.log("Unhandled broadcast event:", event);
    }
  }

  
  const addNotification = useCallback((data: {
    type: RealtimeNotification["type"];
    title: string;
    message: string;
    data?: any;
  }) => {
    const notification: RealtimeNotification = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type,
      title: data.title,
      message: data.message,
      timestamp: new Date().toISOString(),
      read: false,
      data: data.data,
    };

    setNotifications((prev) => [notification, ...prev]);
  }, []);

  
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);


  useEffect(() => {
    if (user && enablePresence) {
      updatePresence({
        last_activity: new Date().toISOString(),
      });
    }
  }, [user, enablePresence, updatePresence]);

  const enhancedBroadcast = useCallback(
    async (event: string, payload: any) => {
      await broadcast(event, payload, user?.id);
    },
    [broadcast, user]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: RealtimeContextValue = {
    onlineUsers: presenceUsers,
    totalOnlineUsers: totalUsers,
    isUserOnline: isOnline,
    broadcast: enhancedBroadcast,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

