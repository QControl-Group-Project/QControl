"use client";

import { useEffect, useState, useCallback } from "react";
import { REALTIME_CHANNEL_STATES } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { QueueToken, Queue } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Wifi, 
  WifiOff, 
  MapPin, 
  Calendar,
  Bell,
  Volume2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer
} from "lucide-react";
import { formatTime, timeAgo, getTokenStatusColor } from "@/lib/utils";

interface TokenTrackerRealtimeProps {
  tokenId: string;
  onStatusChange?: (status: string) => void;
}

export function TokenTrackerRealtime({ 
  tokenId,
  onStatusChange 
}: TokenTrackerRealtimeProps) {
  const [token, setToken] = useState<QueueToken | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  const supabase = createClient();
  type RealtimeChannelState =
    (typeof REALTIME_CHANNEL_STATES)[keyof typeof REALTIME_CHANNEL_STATES];

  const loadTokenData = useCallback(async () => {
    if (!tokenId) return;

    const { data: tokenData, error } = await supabase
      .from("queue_tokens")
      .select("*, queues(*, businesses(name)), businesses(name)")
      .eq("id", tokenId)
      .single();

    if (error) {
      console.error("Error loading token:", error);
      setLoading(false);
      return;
    }

    setToken(tokenData as QueueToken);
    setQueue((tokenData as QueueToken).queues || null);

    if (tokenData.status === "waiting") {
      const { count } = await supabase
        .from("queue_tokens")
        .select("*", { count: "exact", head: true })
        .eq("queue_id", tokenData.queue_id)
        .eq("status", "waiting")
        .lt("token_number", tokenData.token_number);

      setPosition((count || 0) + 1);
    } else {
      setPosition(null);
    }

    setLoading(false);
  }, [tokenId, supabase]);

  const enableNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
      }
    }
  };

  const announceStatusChange = useCallback((newStatus: string, tokenNumber: number) => {
    if (Notification.permission === "granted") {
      const messages: Record<string, string> = {
        called: `Your token #${tokenNumber} has been called! Please proceed to the counter.`,
        serving: `You are now being served. Token #${tokenNumber}`,
        served: `Thank you! Your visit is complete. Token #${tokenNumber}`,
        skipped: `Token #${tokenNumber} was skipped. Please contact staff.`,
      };

      if (messages[newStatus]) {
        new Notification(`Token #${tokenNumber} Update`, {
          body: messages[newStatus],
          icon: "/favicon.ico",
          requireInteraction: newStatus === "called",
        });
      }
    }

    if ("speechSynthesis" in window && newStatus === "called") {
      const utterance = new SpeechSynthesisUtterance(
        `Attention! Token number ${tokenNumber} has been called. Please proceed to the counter immediately.`
      );
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    if (!tokenId) return;

    loadTokenData();

    const channel = supabase
      .channel(`token_tracker_${tokenId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "queue_tokens",
          filter: `id=eq.${tokenId}`,
        },
        (payload: { new: QueueToken }) => {
          const newToken = payload.new as QueueToken;
          setToken(newToken);
          
          if (previousStatus && newToken.status !== previousStatus) {
            onStatusChange?.(newToken.status);
            
            if (notificationsEnabled) {
              announceStatusChange(newToken.status, newToken.token_number);
            }
          }
          setPreviousStatus(newToken.status);

          if (newToken.status === "waiting") {
            loadTokenData();
          } else {
            setPosition(null);
          }
        }
      )
      .subscribe((status: RealtimeChannelState) => {
        setIsConnected(status === REALTIME_CHANNEL_STATES.joined);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tokenId, supabase, previousStatus, notificationsEnabled, loadTokenData, announceStatusChange, onStatusChange]);

  useEffect(() => {
    if (token && !previousStatus) {
      setPreviousStatus(token.status);
    }
  }, [token, previousStatus]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-8 h-64" />
      </Card>
    );
  }

  if (!token) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Token Not Found</p>
          <p className="text-muted-foreground">
            This token does not exist or has expired.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (token.status) {
      case "waiting":
        return <Clock className="h-8 w-8" />;
      case "called":
        return <Bell className="h-8 w-8 animate-bounce" />;
      case "serving":
        return <Timer className="h-8 w-8" />;
      case "served":
        return <CheckCircle className="h-8 w-8" />;
      case "skipped":
      case "cancelled":
        return <XCircle className="h-8 w-8" />;
      default:
        return <Clock className="h-8 w-8" />;
    }
  };

  const getStatusMessage = () => {
    switch (token.status) {
      case "waiting":
        return position 
          ? `You are #${position} in line`
          : "Please wait for your turn";
      case "called":
        return "Your token has been called! Please proceed now.";
      case "serving":
        return "You are currently being served";
      case "served":
        return "Thank you! Your visit is complete.";
      case "skipped":
        return "Your token was skipped. Please contact staff.";
      case "cancelled":
        return "This token has been cancelled.";
      default:
        return "";
    }
  };

  const estimatedWaitMinutes = position && queue 
    ? (position - 1) * (queue.estimated_wait_time || 5)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {isConnected ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Wifi className="h-3 w-3 mr-1" />
            Live Updates
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <WifiOff className="h-3 w-3 mr-1" />
            Connecting...
          </Badge>
        )}
      </div>

      <Card className={`overflow-hidden ${
        token.status === "called" 
          ? "border-green-500 border-2 bg-green-50" 
          : token.status === "serving"
            ? "border-blue-500 border-2 bg-blue-50"
            : ""
      }`}>
        <CardHeader className={`text-center pb-2 ${
          token.status === "called"
            ? "bg-green-600 text-white"
            : token.status === "serving"
              ? "bg-blue-600 text-white"
              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        }`}>
          <CardTitle className="text-lg">Your Token</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center">
            <div className={`text-8xl font-bold mb-4 ${
              token.status === "called" 
                ? "text-green-600 animate-pulse" 
                : token.status === "serving"
                  ? "text-blue-600"
                  : "text-gray-800"
            }`}>
              #{token.token_number}
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={getTokenStatusColor(token.status) + " p-2 rounded-full"}>
                {getStatusIcon()}
              </div>
              <Badge className={getTokenStatusColor(token.status)} variant="default">
                {token.status.toUpperCase()}
              </Badge>
            </div>

            <p className={`text-xl font-medium mb-6 ${
              token.status === "called" ? "text-green-700" : ""
            }`}>
              {getStatusMessage()}
            </p>

            {token.status === "waiting" && position && (
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{position}</p>
                    <p className="text-sm text-muted-foreground">Position</p>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">~{estimatedWaitMinutes}</p>
                    <p className="text-sm text-muted-foreground">Minutes</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{timeAgo(token.created_at)}</p>
            </div>
          </div>

          {queue && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Queue</p>
                <p className="font-medium">{queue.name}</p>
              </div>
            </div>
          )}

          {token.purpose && (
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Purpose</p>
                <p className="font-medium">{token.purpose}</p>
              </div>
            </div>
          )}

          {token.called_at && (
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Called at</p>
                <p className="font-medium">{formatTime(token.called_at)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Get Notified</p>
                <p className="text-sm text-muted-foreground">
                  Receive alerts when your token is called
                </p>
              </div>
            </div>
            <Button
              variant={notificationsEnabled ? "default" : "outline"}
              onClick={enableNotifications}
              disabled={notificationsEnabled}
            >
              {notificationsEnabled ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Enabled
                </>
              ) : (
                "Enable"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

