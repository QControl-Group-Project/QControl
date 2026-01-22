 "use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/layouts/loadingSpinner";
import { getTokenStatusColor, timeAgo } from "@/lib/utils";
import { Hospital, Queue, QueueToken } from "@/lib/types";
import { Clock, MapPin, Phone, RefreshCw, Timer, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type TokenTracking = {
  token: QueueToken & { queues?: Queue; hospitals?: Hospital };
  position: number;
  estimatedWait: number;
};

interface TokenTrackingCardProps {
  tokenId: string;
}

export function TokenTrackingCard({ tokenId }: TokenTrackingCardProps) {
  const [data, setData] = useState<TokenTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/queue/track-token?tokenId=${tokenId}`);
      const body = await response.json().catch(() => ({}));

      if (!response.ok || !body?.token) {
        const message = body?.error || "Token not found";
        setError(message);
        toast({
          title: "Unable to fetch token",
          description: message,
          variant: "destructive",
        });
        setData(null);
        return;
      }

      setData({
        token: body.token,
        position: body.position ?? 0,
        estimatedWait: body.estimatedWait ?? 0,
      });
    } catch (err) {
      console.error("Failed to load token", err);
      setError("Something went wrong while loading the token");
      toast({
        title: "Error",
        description: "Something went wrong while loading the token",
        variant: "destructive",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, [tokenId]);

  if (loading && !data) {
    return <LoadingSpinner text="Fetching your token status..." />;
  }

  if (error && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Track Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-red-600">{error}</p>
          <Button onClick={fetchToken}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { token, position, estimatedWait } = data;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <span className="text-4xl font-bold text-blue-600">
              #{token.token_number}
            </span>
            <Badge className={getTokenStatusColor(token.status)}>
              {token.status}
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchToken}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Last updated {timeAgo(token.created_at)}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4" />
              <span className="font-medium">{token.patient_name}</span>
              {token.patient_age && (
                <span className="text-gray-500 text-sm">
                  ({token.patient_age} yrs)
                </span>
              )}
            </div>
            {token.patient_phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{token.patient_phone}</span>
              </div>
            )}
            {token.purpose && (
              <p className="text-sm text-gray-600">{token.purpose}</p>
            )}
          </div>

          <div className="space-y-2">
            {token.queues?.name && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4" />
                <div>
                  <p className="font-medium">{token.queues.name}</p>
                  {token.hospitals?.name && (
                    <p className="text-sm text-gray-500">
                      {token.hospitals.name}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4" />
              <span>Created {timeAgo(token.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Position in queue
            </p>
            <p className="text-2xl font-bold text-blue-900">{position || 0}</p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <p className="text-sm text-emerald-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Estimated wait
            </p>
            <p className="text-2xl font-bold text-emerald-900">
              {Math.max(estimatedWait, 0)} mins
            </p>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Status
            </p>
            <p className="text-lg font-semibold capitalize">{token.status}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

