"use client";

import { useRealtimeQueue } from "@/lib/hooks/useRealtimeQueue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Clock, 
  Wifi, 
  WifiOff, 
  Volume2, 
  Bell,
  AlertCircle,
  CheckCircle2,
  Timer,
  Hash
} from "lucide-react";
import { useEffect, useState } from "react";
import { QueueToken } from "@/lib/types";

interface RealtimeQueueDisplayProps {
  queueId: string;
  showNotificationButton?: boolean;
  onTokenCalled?: (token: QueueToken) => void;
}

export function RealtimeQueueDisplay({
  queueId,
  showNotificationButton = true,
  onTokenCalled,
}: RealtimeQueueDisplayProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [lastAnnouncedToken, setLastAnnouncedToken] = useState<number | null>(null);

  const {
    queue,
    tokens,
    stats,
    currentServingToken,
    nextToken,
    loading,
    isConnected,
  } = useRealtimeQueue(queueId, {
    onTokenCalled: (token) => {
      onTokenCalled?.(token);
      
      if (notificationsEnabled && token.token_number !== lastAnnouncedToken) {
        announceToken(token);
        setLastAnnouncedToken(token.token_number);
      }
    },
  });

  const enableNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
      }
    }
  };

  const announceToken = (token: QueueToken) => {
    if (Notification.permission === "granted") {
      new Notification(`Token #${token.token_number} Called`, {
        body: `${token.patient_name}, please proceed to the counter`,
        icon: "/favicon.ico",
      });
    }

    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(
        `Token number ${token.token_number}. ${token.patient_name}, please proceed to the counter.`
      );
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };
  
  const waitingTokens = tokens.filter(t => t.status === "waiting");
  const estimatedWaitMinutes = waitingTokens.length * (queue?.estimated_wait_time || 5);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-8 h-48" />
        </Card>
      </div>
    );
  }

  if (!queue) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Queue not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{queue.name}</h2>
          {queue.departments && (
            <p className="text-muted-foreground">{queue.departments.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Wifi className="h-3 w-3 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <WifiOff className="h-3 w-3 mr-1" />
              Connecting...
            </Badge>
          )}
          <Badge variant={queue.is_active ? "default" : "secondary"}>
            {queue.is_active ? "Open" : "Closed"}
          </Badge>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <CardContent className="p-8 relative">
          <div className="text-center">
            <p className="text-blue-100 text-lg mb-2">Now Serving</p>
            {currentServingToken ? (
              <>
                <div className="text-7xl font-bold mb-4 tracking-tight">
                  #{currentServingToken.token_number}
                </div>
                <p className="text-blue-100 text-xl">
                  {currentServingToken.patient_name}
                </p>
              </>
            ) : (
              <div className="text-4xl font-bold mb-4 text-blue-200">
                No one being served
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-3xl font-bold">{stats?.waiting || 0}</p>
            <p className="text-sm text-muted-foreground">Waiting</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Timer className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <p className="text-3xl font-bold">{stats?.serving || 0}</p>
            <p className="text-sm text-muted-foreground">Serving</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-3xl font-bold">{stats?.served || 0}</p>
            <p className="text-sm text-muted-foreground">Served Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-3xl font-bold">~{estimatedWaitMinutes}</p>
            <p className="text-sm text-muted-foreground">Est. Wait (min)</p>
          </CardContent>
        </Card>
      </div>

      {nextToken && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-600" />
              Next Up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-yellow-700">
                  #{nextToken.token_number}
                </div>
                <div>
                  <p className="font-medium">{nextToken.patient_name}</p>
                  {nextToken.purpose && (
                    <p className="text-sm text-muted-foreground">{nextToken.purpose}</p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                Get Ready
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {showNotificationButton && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Audio Announcements</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when tokens are called
                  </p>
                </div>
              </div>
              <Button
                variant={notificationsEnabled ? "default" : "outline"}
                onClick={enableNotifications}
                disabled={notificationsEnabled}
              >
                {notificationsEnabled ? "Enabled" : "Enable"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {waitingTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Waiting Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {waitingTokens.slice(0, 5).map((token, index) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">
                      {index + 1}.
                    </span>
                    <div>
                      <span className="font-semibold">#{token.token_number}</span>
                      <span className="text-muted-foreground ml-2">{token.patient_name}</span>
                    </div>
                  </div>
                  {token.priority > 0 && (
                    <Badge variant="destructive" className="text-xs">Priority</Badge>
                  )}
                </div>
              ))}
              {waitingTokens.length > 5 && (
                <p className="text-center text-muted-foreground text-sm py-2">
                  +{waitingTokens.length - 5} more in queue
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

