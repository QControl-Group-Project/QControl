"use client";

import { QueueToken } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTokenStatusColor, formatTime, timeAgo } from "@/lib/utils";
import { Clock, User, Phone, MapPin, Timer, Ticket } from "lucide-react";
import Link from "next/link";

interface QueueTokenCardProps {
  token: QueueToken;
  onCall?: (tokenId: string) => void;
  onServe?: (tokenId: string) => void;
  onComplete?: (tokenId: string) => void;
  onSkip?: (tokenId: string) => void;
  showActions?: boolean;
  showTrackLink?: boolean;
}

export function QueueTokenCard({
  token,
  onCall,
  onServe,
  onComplete,
  onSkip,
  showActions = false,
  showTrackLink = false,
}: QueueTokenCardProps) {
  const queueName = token.queues?.name ?? null;
  const businessName = token.businesses?.name ?? null;

  return (
    <Card className="overflow-hidden border-muted/60 bg-card/95 shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Token
            </p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-primary">
                #{token.token_number}
              </span>
              <Badge className={getTokenStatusColor(token.status)}>
                {token.status}
              </Badge>
            </div>
            {(queueName || businessName) && (
              <div className="text-sm text-muted-foreground">
                {queueName && <p className="font-medium text-foreground">{queueName}</p>}
                {businessName && (
                  <p className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" />
                    {businessName}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-1">
            <div className="flex items-center justify-end gap-1">
              <Timer className="h-3 w-3" />
              <span>{formatTime(token.created_at)}</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <Clock className="h-3 w-3" />
              <span>{timeAgo(token.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="text-foreground">{token.patient_name}</span>
            {token.patient_age && (
              <span className="text-xs text-muted-foreground">
                ({token.patient_age} years)
              </span>
            )}
          </div>

          {token.patient_phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{token.patient_phone}</span>
            </div>
          )}

          {token.purpose && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Purpose:</span>{" "}
              {token.purpose}
            </div>
          )}
        </div>

        {showTrackLink && (
          <Link href={`/track-token/${token.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              <Ticket className="h-4 w-4 mr-2" />
              Track Token
            </Button>
          </Link>
        )}

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
      </CardContent>
    </Card>
  );
}
