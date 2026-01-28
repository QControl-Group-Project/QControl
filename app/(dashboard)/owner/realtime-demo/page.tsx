

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRealtimeContext } from "@/lib/providers/realtime-provider";
import { useRealtimePresence } from "@/lib/hooks/useRealtimePresence";
import { useRealtimeBroadcast } from "@/lib/hooks/useRealtimeBroadcast";
import { 
  RealtimeNotificationBell, 
  RealtimeNotificationPanel 
} from "@/components/notifications/realtime-notifications";
import { 
  Users, 
  Radio, 
  Bell, 
  Wifi, 
  Activity,
  Send,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function RealtimeDemoPage() {
  const { user } = useAuth();
  const { 
    onlineUsers, 
    totalOnlineUsers, 
    isConnected,
    broadcast: globalBroadcast,
    notifications 
  } = useRealtimeContext();

  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");

  
  const {
    presenceUsers: demoPresenceUsers,
    totalUsers: demoTotalUsers,
    connectionState,
  } = useRealtimePresence({
    channelName: "demo_room",
    userInfo: {
      user_id: user?.id || "demo_user",
      user_name: user?.user_metadata?.full_name || "Demo User",
      user_role: user?.user_metadata?.role || "guest",
    },
  });

  
  const { 
    broadcast: demoBroadcast, 
    isConnected: demoChannelConnected 
  } = useRealtimeBroadcast({
    channelName: "demo_channel",
    events: ["demo_message", "demo_alert"],
    onEvent: (event) => {
      console.log("Demo event received:", event);
    },
  });

  const handleSendBroadcast = async () => {
    if (!broadcastMessage) return;
    
    try {
      await demoBroadcast("demo_message", {
        title: broadcastTitle || "Demo Message",
        message: broadcastMessage,
        sender: user?.user_metadata?.full_name || "Anonymous",
      });
      
      setBroadcastMessage("");
      setBroadcastTitle("");
    } catch (error) {
      console.error("Failed to send broadcast:", error);
    }
  };

  const handleSendGlobalNotification = async () => {
    await globalBroadcast("notification", {
      type: "info",
      title: "Test Notification",
      message: "This is a test notification from the realtime demo!",
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Realtime Features Demo</h1>
          <p className="text-muted-foreground mt-1">
            Explore all realtime capabilities of QControl
          </p>
        </div>
        <div className="flex items-center gap-4">
          <RealtimeNotificationBell />
          <Badge variant={isConnected ? "default" : "secondary"}>
            <Wifi className="h-3 w-3 mr-1" />
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

       
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOnlineUsers}</p>
                <p className="text-sm text-muted-foreground">Online Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-sm text-muted-foreground">Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectionState}</p>
                <p className="text-sm text-muted-foreground">Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      
      <Tabs defaultValue="presence" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="presence">
            <Users className="h-4 w-4 mr-2" />
            Presence
          </TabsTrigger>
          <TabsTrigger value="broadcast">
            <Radio className="h-4 w-4 mr-2" />
            Broadcast
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="docs">
            <AlertCircle className="h-4 w-4 mr-2" />
            Docs
          </TabsTrigger>
        </TabsList>

        
        <TabsContent value="presence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Presence</CardTitle>
              <CardDescription>
                Users currently online in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {onlineUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No other users online
                  </p>
                ) : (
                  onlineUsers.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-700 font-semibold">
                            {user.user_name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.user_name || "Anonymous"}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {user.user_role || "guest"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        Online
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demo Room Presence</CardTitle>
              <CardDescription>
                Users in the demo room channel ({demoTotalUsers} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoPresenceUsers.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-200 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 text-sm font-semibold">
                          {user.user_name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <p className="font-medium">{user.user_name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.online_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

       
        <TabsContent value="broadcast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Broadcast Message</CardTitle>
              <CardDescription>
                Send a message to all users in the demo channel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Message title"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Enter your message..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSendBroadcast}
                  disabled={!demoChannelConnected || !broadcastMessage}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to Demo Channel
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleSendGlobalNotification}
                  disabled={!isConnected}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Send Global Notification
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  {demoChannelConnected ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-muted-foreground">
                    Demo Channel: {demoChannelConnected ? "Connected" : "Connecting..."}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Broadcast Events</CardTitle>
              <CardDescription>
                Open browser console to see received events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <code className="text-sm">
                  Events: demo_message, demo_alert
                  <br />
                  Channel: demo_channel
                  <br />
                  Status: {demoChannelConnected ? "Listening" : "Not connected"}
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        
        <TabsContent value="notifications">
          <RealtimeNotificationPanel />
        </TabsContent>

       
        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Hooks & Components</CardTitle>
              <CardDescription>
                Overview of realtime features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Hooks</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <code className="bg-muted px-2 py-1 rounded">useRealtimeQueue</code>
                      <p className="text-muted-foreground">Real-time queue management</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <code className="bg-muted px-2 py-1 rounded">useRealtimeAppointments</code>
                      <p className="text-muted-foreground">Real-time appointment tracking</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <code className="bg-muted px-2 py-1 rounded">useQueuePositionTracking</code>
                      <p className="text-muted-foreground">Track position in queue</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <code className="bg-muted px-2 py-1 rounded">useRealtimePresence</code>
                      <p className="text-muted-foreground">User presence tracking</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <code className="bg-muted px-2 py-1 rounded">useRealtimeBroadcast</code>
                      <p className="text-muted-foreground">Custom event broadcasting</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Components</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <code className="bg-muted px-2 py-1 rounded">RealtimeQueueDisplay</code>
                      <p className="text-muted-foreground">Live queue display board</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <code className="bg-muted px-2 py-1 rounded">EnhancedTokenTracker</code>
                      <p className="text-muted-foreground">Patient token tracker</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <code className="bg-muted px-2 py-1 rounded">AppointmentTrackerRealtime</code>
                      <p className="text-muted-foreground">Appointment status tracker</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <code className="bg-muted px-2 py-1 rounded">RealtimeNotificationBell</code>
                      <p className="text-muted-foreground">Notification dropdown</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  For complete documentation, see{" "}
                  <code className="bg-muted px-2 py-1 rounded">REALTIME_FEATURES.md</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

