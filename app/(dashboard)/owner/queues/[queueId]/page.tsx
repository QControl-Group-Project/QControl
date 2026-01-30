"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useRealtimeQueue } from "@/lib/hooks/useRealtimeQueue";
import { useRealtimeContext } from "@/lib/providers/realtime-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/layouts/PageHeader";
import { EmptyState } from "@/components/layouts/EmptyState";
import { QueueTokenCard } from "@/components/queue/QueueTokenCard";
import QRCode from "react-qr-code";
import { 
  ClipboardList, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Wifi,
  WifiOff,
  Play,
  Volume2,
  SkipForward
} from "lucide-react";
import { QueueToken } from "@/lib/types";

export default function AdminQueueDetailPage() {
  const params = useParams<{ queueId?: string | string[] }>();
  const queueId = Array.isArray(params.queueId)
    ? params.queueId[0]
    : params.queueId;
  const [copied, setCopied] = useState(false);
  const qrWrapperRef = useRef<HTMLDivElement | null>(null);
  const { broadcast } = useRealtimeContext();

  const {
    queue,
    tokens,
    stats,
    currentServingToken,
    nextToken,
    loading,
    isConnected,
    callToken,
    startServing,
    completeToken,
    skipToken,
    recallToken,
    toggleQueueStatus,
  } = useRealtimeQueue(queueId || "", {
    onTokenCalled: (token) => {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(
          `Token number ${token.token_number}, ${token.patient_name}, please proceed to the counter.`
        );
        speechSynthesis.speak(utterance);
      }
    },
  });

  const shareUrl = useMemo(() => {
    if (!queue) return "";
    const path = `/queue/${queue.business_id}?queue=${queue.id}`;
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }, [queue]);

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy share link:", error);
    }
  };

  const handleDownloadQr = () => {
    const svg = qrWrapperRef.current?.querySelector("svg");
    if (!svg || !shareUrl) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    if (!source.includes("xmlns=")) {
      source = source.replace(
        "<svg",
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
    }

    const svgBlob = new Blob([source], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `queue-qr-${queue?.id ?? "code"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = url;
  };

  const notifyTokenCustomer = useCallback(
    async (tokenId: string, action: "called" | "skipped" | "recalled") => {
      const token = tokens.find((item) => item.id === tokenId);
      if (!token?.patient_id) return;
      const tokenLabel = token.token_number ? `#${token.token_number}` : "your token";
      const title =
        action === "skipped" ? "Token Skipped" : "Token Called";
      const message =
        action === "skipped"
          ? `Token ${tokenLabel} was skipped. Please contact the counter.`
          : `Token ${tokenLabel} has been called. Please proceed to the counter.`;

      await broadcast("notification", {
        type: action === "skipped" ? "error" : "warning",
        title,
        message,
        userId: token.patient_id,
        data: { tokenId, status: action },
      });
    },
    [tokens, broadcast]
  );

  const handleCallToken = async (tokenId: string) => {
    await callToken(tokenId);
    await notifyTokenCustomer(tokenId, "called");
  };

  const handleRecallToken = async (tokenId: string) => {
    await recallToken(tokenId);
    await notifyTokenCustomer(tokenId, "recalled");
  };

  const handleSkipToken = async (tokenId: string) => {
    await skipToken(tokenId);
    await notifyTokenCustomer(tokenId, "skipped");
  };

  if (!queueId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={ClipboardList}
          title="Invalid Queue"
          description="No queue ID provided."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-4 h-20" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="p-6">
        <EmptyState
          icon={ClipboardList}
          title="Queue not found"
          description="This queue could not be loaded."
        />
      </div>
    );
  }

  const waitingTokens = tokens.filter(t => t.status === "waiting");
  const calledTokens = tokens.filter(t => t.status === "called");
  const servingTokens = tokens.filter(t => t.status === "serving");
  const completedTokens = tokens.filter(t => t.status === "served" || t.status === "skipped");

  return (
    <div className="p-6 space-y-6">
     
      <PageHeader
        title={queue.name}
        description={queue.departments?.name ?? "Queue Management"}
        action={
          <div className="flex items-center gap-4">
          
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
            
           
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {queue.is_active ? "Open" : "Closed"}
              </span>
              <Switch
                checked={queue.is_active}
                onCheckedChange={(checked) => toggleQueueStatus(checked)}
              />
            </div>
          </div>
        }
      />

       
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.waiting}</p>
                  <p className="text-sm text-muted-foreground">Waiting</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Volume2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.called}</p>
                  <p className="text-sm text-muted-foreground">Called</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Play className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.serving}</p>
                  <p className="text-sm text-muted-foreground">Serving</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.served}</p>
                  <p className="text-sm text-muted-foreground">Served</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Share This Queue</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div ref={qrWrapperRef} className="rounded-lg border bg-white p-3">
              <QRCode value={shareUrl || queue.id} size={140} />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Share this QR so customers can join the queue without logging in.
              </p>
              <p className="text-xs text-muted-foreground break-all">{shareUrl}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCopyShareLink}>
              {copied ? "Copied" : "Copy Link"}
            </Button>
            <Button variant="outline" onClick={handleDownloadQr}>
              Download PNG
            </Button>
            <Button onClick={() => window.open(shareUrl, "_blank")}>
              Open Link
            </Button>
          </div>
        </CardContent>
      </Card>

      
      {currentServingToken && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5 text-purple-600" />
              Currently Serving
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-purple-600">
                  #{currentServingToken.token_number}
                </div>
                <div>
                  <p className="font-medium text-lg">{currentServingToken.patient_name}</p>
                  {currentServingToken.purpose && (
                    <p className="text-sm text-muted-foreground">{currentServingToken.purpose}</p>
                  )}
                </div>
              </div>
              <Button 
                onClick={() => completeToken(currentServingToken.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

       
      {calledTokens.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-blue-600" />
              Called ({calledTokens.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {calledTokens.map(token => (
              <div key={token.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-blue-600">#{token.token_number}</div>
                  <div>
                    <p className="font-medium">{token.patient_name}</p>
                    <p className="text-sm text-muted-foreground">{token.patient_phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => startServing(token.id)} size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                  <Button onClick={() => handleRecallToken(token.id)} variant="outline" size="sm">
                    <Volume2 className="h-4 w-4 mr-1" />
                    Recall
                  </Button>
                  <Button onClick={() => handleSkipToken(token.id)} variant="outline" size="sm">
                    <SkipForward className="h-4 w-4 mr-1" />
                    Skip
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

       
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Waiting Queue ({waitingTokens.length})
            </CardTitle>
            {nextToken && !currentServingToken && !calledTokens.length && (
              <Button onClick={() => handleCallToken(nextToken.id)}>
                <Volume2 className="h-4 w-4 mr-2" />
                Call Next
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {waitingTokens.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No one waiting"
              description="The queue is empty."
            />
          ) : (
            <div className="space-y-3">
              {waitingTokens.map((token) => (
                <QueueTokenCard
                  key={token.id}
                  token={token}
                  onCall={handleCallToken}
                  onSkip={handleSkipToken}
                  showActions
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

       {completedTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Completed Today ({completedTokens.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {completedTokens.map((token) => (
                <div 
                  key={token.id} 
                  className={`p-3 rounded-lg text-center ${
                    token.status === "served" 
                      ? "bg-green-50 text-green-700" 
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <p className="font-bold">#{token.token_number}</p>
                  <p className="text-xs truncate">{token.patient_name}</p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs mt-1 ${
                      token.status === "served" ? "border-green-300" : "border-gray-300"
                    }`}
                  >
                    {token.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
