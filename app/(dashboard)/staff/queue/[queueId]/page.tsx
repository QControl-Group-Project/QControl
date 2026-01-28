"use client";

import { use } from "react";
import { useRealtimeQueue } from "@/lib/hooks/useRealtimeQueue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layouts/PageHeader";
import { EmptyState } from "@/components/layouts/EmptyState";
import { QueueTokenCard } from "@/components/queue/QueueTokenCard";
import { Switch } from "@/components/ui/switch";
import { 
  ClipboardList, 
  Users, 
  Clock, 
  CheckCircle, 
  Play,
  Wifi,
  WifiOff,
  Volume2,
  SkipForward
} from "lucide-react";

export default function StaffQueuePage({
  params,
}: {
  params: Promise<{ queueId: string }>;
}) {
  const { queueId } = use(params);

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
  } = useRealtimeQueue(queueId, {
    onTokenCalled: (token) => {
      
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(
          `Token number ${token.token_number}, ${token.patient_name}, please proceed to the counter.`
        );
        speechSynthesis.speak(utterance);
      }
    },
  });

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
          description="This queue could not be loaded or you don't have access."
        />
      </div>
    );
  }

  const waitingTokens = tokens.filter(t => t.status === "waiting");
  const calledTokens = tokens.filter(t => t.status === "called");
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <p className="text-sm text-muted-foreground">{currentServingToken.patient_phone}</p>
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
                  <Button onClick={() => recallToken(token.id)} variant="outline" size="sm">
                    <Volume2 className="h-4 w-4 mr-1" />
                    Recall
                  </Button>
                  <Button onClick={() => skipToken(token.id)} variant="outline" size="sm">
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
              <Button onClick={() => callToken(nextToken.id)}>
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
                  onCall={callToken}
                  onSkip={skipToken}
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
              Completed ({completedTokens.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {completedTokens.slice(0, 12).map((token) => (
                <div 
                  key={token.id} 
                  className={`p-2 rounded-lg text-center text-sm ${
                    token.status === "served" 
                      ? "bg-green-50 text-green-700" 
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <p className="font-bold">#{token.token_number}</p>
                  <p className="text-xs truncate">{token.patient_name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
