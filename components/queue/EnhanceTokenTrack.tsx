

"use client";

import { useEffect, useState } from "react";
import { useQueuePositionTracking } from "@/lib/hooks/useQueuePositionTracking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Clock,
  TrendingDown,
  Bell,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface EnhancedTokenTrackerProps {
  tokenId: string;
  queueId: string;
  tokenNumber: number;
  patientName: string;
  onTokenCalled?: () => void;
}

export function EnhancedTokenTracker({
  tokenId,
  queueId,
  tokenNumber,
  patientName,
  onTokenCalled,
}: EnhancedTokenTrackerProps) {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [lastNotifiedPosition, setLastNotifiedPosition] = useState<number | null>(null);

  const { position, loading, error, isConnected, refresh } = useQueuePositionTracking({
    tokenId,
    queueId,
    onPositionChange: (newPosition) => {
      
      if (
        lastNotifiedPosition !== null &&
        newPosition.currentPosition < lastNotifiedPosition &&
        notificationsEnabled
      ) {
        toast({
          title: "You're Getting Closer!",
          description: `${newPosition.peopleAhead} ${
            newPosition.peopleAhead === 1 ? "person" : "people"
          } ahead of you now.`,
        });
      }
      setLastNotifiedPosition(newPosition.currentPosition);
    },
    onTokenCalled: () => {
      toast({
        title: "🔔 Your Token is Called!",
        description: "Please proceed to the counter immediately.",
        variant: "default",
      });
      onTokenCalled?.();
    },
    onAlmostReady: (peopleAhead) => {
      if (notificationsEnabled) {
        toast({
          title: "Almost Your Turn!",
          description: `Only ${peopleAhead} ${
            peopleAhead === 1 ? "person" : "people"
          } ahead of you.`,
        });
      }
    },
    enableNotifications: notificationsEnabled,
  });

  const enableNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        toast({
          title: "Notifications Enabled",
          description: "You'll be notified when your token is called",
        });
      }
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-8 h-64" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-red-600">{error}</p>
          <Button variant="outline" className="mt-4" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!position) return null;

  const progressPercentage = position.totalWaiting > 0
    ? ((position.totalWaiting - position.peopleAhead) / position.totalWaiting) * 100
    : 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3 mr-1" />
              Live Updates
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 mr-1" />
              Connecting...
            </>
          )}
        </Badge>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {position.isCalled && (
        <Card className="border-green-500 border-2 bg-green-50 animate-pulse">
          <CardContent className="p-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                Your Token is Called!
              </h2>
              <p className="text-green-600 text-lg">
                Please proceed to the counter immediately
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {position.isServing && (
        <Card className="border-blue-500 border-2 bg-blue-50">
          <CardContent className="p-6">
            <div className="text-center">
              <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-blue-700 mb-2">
                You're Being Served
              </h2>
              <p className="text-blue-600">Your consultation is in progress</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!position.isCalled && !position.isServing && (
        <>
          <Card className={position.isNextUp ? "border-yellow-500 border-2" : ""}>
            <CardHeader className="text-center pb-2">
              <CardTitle>Your Token: #{tokenNumber}</CardTitle>
              <p className="text-muted-foreground">{patientName}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                {position.isNextUp ? (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-4">
                    <Bell className="h-12 w-12 text-yellow-600 mx-auto mb-3 animate-bounce" />
                    <p className="text-2xl font-bold text-yellow-700">
                      You're Next!
                    </p>
                    <p className="text-yellow-600 mt-2">Please be ready</p>
                  </div>
                ) : (
                  <>
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-4">
                      <div className="text-center">
                        <p className="text-5xl font-bold">{position.peopleAhead}</p>
                        <p className="text-sm opacity-90">ahead</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      Position {position.currentPosition} of {position.totalWaiting}
                    </p>
                  </>
                )}
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">
                      ~{position.estimatedWaitMinutes}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Minutes Wait
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold">
                      {position.totalWaiting}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Waiting
                    </p>
                  </CardContent>
                </Card>
              </div>

              {position.peopleAhead > 5 && (
                <Card className="bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <TrendingDown className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">
                          You have some time
                        </p>
                        <p className="text-sm text-blue-700">
                          Feel free to grab a coffee, but stay nearby!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {position.peopleAhead <= 2 && position.peopleAhead > 0 && (
                <Card className="bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Bell className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900">
                          Almost Your Turn!
                        </p>
                        <p className="text-sm text-yellow-700">
                          Please stay close to the counter
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Enable Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get alerted when your token is called
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
        </>
      )}
    </div>
  );
}

