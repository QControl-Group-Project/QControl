"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type SessionInfo = {
  userId?: string;
  email?: string;
  role?: string;
  expiresAt?: number | null;
  accessToken?: string | null;
  refreshToken?: string | null;
};

export function SessionDebug() {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const loadSession = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSessionInfo(
        session
          ? {
              userId: session.user.id,
              email: session.user.email ?? undefined,
              role: session.user.user_metadata?.role,
              expiresAt: session.expires_at ?? null,
              accessToken: session.access_token ?? null,
              refreshToken: session.refresh_token ?? null,
            }
          : null
      );
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        console.error("Failed to load session:", error);
      }
      setSessionInfo(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSession();
  }, []);

  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Session Debug</CardTitle>
        <Button onClick={loadSession} variant="outline" size="sm">
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {sessionInfo ? (
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-gray-500">No active session found.</p>
        )}
      </CardContent>
    </Card>
  );
}

