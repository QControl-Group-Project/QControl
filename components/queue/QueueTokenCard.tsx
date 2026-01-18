"use client";

import { QueueToken } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTokenStatusColor, formatTime, timeAgo } from "@/lib/utils";
import { Clock, User, Phone } from "lucide-react";

interface QueueTokenCardProps {
  token: QueueToken;
  onCall?: (tokenId: string) => void;
  onServe?: (tokenId: string) => void;
  onComplete?: (tokenId: string) => void;
  onSkip?: (tokenId: string) => void;
  showActions?: boolean;
}

export function QueueTokenCard({
  token,
  onCall,
  onServe,
  onComplete,
  onSkip,
  showActions = false,
}: QueueTokenCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold text-blue-600">
                #{token.token_number}
              </span>
              <Badge className={getTokenStatusColor(token.status)}>
                {token.status}
              </Badge>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4" />
                <span>{token.patient_name}</span>
                {token.patient_age && <span>({token.patient_age} years)</span>}
              </div>

              {token.patient_phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{token.patient_phone}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{timeAgo(token.created_at)}</span>
              </div>

              {token.purpose && (
                <p className="text-gray-600 mt-2">{token.purpose}</p>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex flex-col gap-2">
              {token.status === "waiting" && onCall && (
                <Button onClick={() => onCall(token.id)} size="sm">
                  Call
                </Button>
              )}
              {token.status === "called" && onServe && (
                <Button onClick={() => onServe(token.id)} size="sm">
                  Start Serving
                </Button>
              )}
              {token.status === "serving" && onComplete && (
                <Button onClick={() => onComplete(token.id)} size="sm">
                  Complete
                </Button>
              )}
              {(token.status === "waiting" || token.status === "called") &&
                onSkip && (
                  <Button
                    onClick={() => onSkip(token.id)}
                    variant="outline"
                    size="sm"
                  >
                    Skip
                  </Button>
                )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
