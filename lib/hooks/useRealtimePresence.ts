

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RealtimeClient, PresenceState, ConnectionState } from "@/lib/supabase/realtime-client";

export interface PresenceUser {
  user_id: string;
  user_name?: string;
  user_role?: string;
  online_at: string;
  [key: string]: any;
}

export interface UseRealtimePresenceOptions {
  channelName: string;
  userInfo: {
    user_id: string;
    user_name?: string;
    user_role?: string;
    [key: string]: any;
  };
  onPresenceChange?: (users: PresenceUser[]) => void;
  onUserJoin?: (user: PresenceUser) => void;
  onUserLeave?: (user: PresenceUser) => void;
  autoTrack?: boolean; 
}

export interface UseRealtimePresenceReturn {
  presenceUsers: PresenceUser[];
  totalUsers: number;
  isOnline: boolean;
  connectionState: ConnectionState;
  startTracking: () => void;
  stopTracking: () => void;
  updatePresence: (data: Record<string, any>) => void;
}

export function useRealtimePresence(
  options: UseRealtimePresenceOptions
): UseRealtimePresenceReturn {
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [isTracking, setIsTracking] = useState(false);
  
  const clientRef = useRef<RealtimeClient | null>(null);
  const previousUsersRef = useRef<Set<string>>(new Set());

  const {
    channelName,
    userInfo,
    onPresenceChange,
    onUserJoin,
    onUserLeave,
    autoTrack = true,
  } = options;

  useEffect(() => {
    const client = new RealtimeClient({
      channelName: `presence_${channelName}`,
      enablePresence: true,
      presenceKey: userInfo.user_id,
      onConnectionChange: setConnectionState,
      onError: (error) => {
        console.error("Presence tracking error:", error);
      },
    });

    clientRef.current = client;

    return () => {
      client.disconnect();
    };
  }, [channelName, userInfo.user_id]);

  const parsePresenceState = useCallback((state: PresenceState): PresenceUser[] => {
    const users: PresenceUser[] = [];
    
    Object.keys(state).forEach((key) => {
      state[key].forEach((presence) => {
        users.push(presence as PresenceUser);
      });
    });

    return users;
  }, []);

  const handlePresenceChange = useCallback((state: PresenceState) => {
    const users = parsePresenceState(state);
    setPresenceUsers(users);
    onPresenceChange?.(users);

    const currentUserIds = new Set(users.map(u => u.user_id));
    
    users.forEach(user => {
      if (!previousUsersRef.current.has(user.user_id)) {
        onUserJoin?.(user);
      }
    });

    previousUsersRef.current.forEach(userId => {
      if (!currentUserIds.has(userId)) {
        const leftUser = presenceUsers.find(u => u.user_id === userId);
        if (leftUser) {
          onUserLeave?.(leftUser);
        }
      }
    });

    previousUsersRef.current = currentUserIds;
  }, [parsePresenceState, onPresenceChange, onUserJoin, onUserLeave, presenceUsers]);

  const startTracking = useCallback(async () => {
    if (!clientRef.current || isTracking) return;

    try {
      await clientRef.current.connect();
      
      clientRef.current.onPresence(handlePresenceChange);
      
      clientRef.current.trackPresence(userInfo);
      
      setIsTracking(true);
    } catch (error) {
      console.error("Failed to start presence tracking:", error);
    }
  }, [isTracking, userInfo, handlePresenceChange]);

  const stopTracking = useCallback(async () => {
    if (!clientRef.current || !isTracking) return;

    try {
      await clientRef.current.untrack();
      setIsTracking(false);
    } catch (error) {
      console.error("Failed to stop presence tracking:", error);
    }
  }, [isTracking]);

  const updatePresence = useCallback((data: Record<string, any>) => {
    if (!clientRef.current || !isTracking) return;

    clientRef.current.trackPresence({
      ...userInfo,
      ...data,
    });
  }, [isTracking, userInfo]);

  useEffect(() => {
    if (autoTrack) {
      startTracking();
    }

    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [autoTrack]); 

  const isOnline = presenceUsers.some(u => u.user_id === userInfo.user_id);

  return {
    presenceUsers,
    totalUsers: presenceUsers.length,
    isOnline,
    connectionState,
    startTracking,
    stopTracking,
    updatePresence,
  };
}


export function useUserOnlineStatus(
  channelName: string,
  targetUserId: string
): { isOnline: boolean; lastSeen?: string } {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | undefined>();

  useRealtimePresence({
    channelName,
    userInfo: { user_id: "observer" },
    onPresenceChange: (users) => {
      const targetUser = users.find(u => u.user_id === targetUserId);
      setIsOnline(!!targetUser);
      if (targetUser) {
        setLastSeen(targetUser.online_at);
      }
    },
    autoTrack: true,
  });

  return { isOnline, lastSeen };
}

