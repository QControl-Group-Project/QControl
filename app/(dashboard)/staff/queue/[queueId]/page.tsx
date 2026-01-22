"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QueueStats, QueueToken } from "@/lib/types";

export default function StaffQueuePage({
  params,
}: {
  params: { queueId: string };
}) {
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const supabase = createClient();

  const loadTokens = async () => {
    const { data } = await supabase
      .from("queue_tokens")
      .select("*")
      .eq("queue_id", params.queueId)
      .gte("created_at", new Date().toISOString().split("T")[0])
      .order("token_number", { ascending: true });
    setTokens((data as QueueToken[]) || []);
  };

  const loadStats = async () => {
    const { data } = await supabase
      .rpc("get_queue_stats", { p_queue_id: params.queueId })
      .single();
    setStats((data as QueueStats) || null);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTokens();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("queue_tokens_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_tokens",
          filter: `queue_id=eq.${params.queueId}`,
        },
        () => {
          loadTokens();
          loadStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.queueId]);

  const callToken = async (tokenId: string) => {
    await supabase
      .from("queue_tokens")
      .update({ status: "called", called_at: new Date().toISOString() })
      .eq("id", tokenId);
  };

  const startServing = async (tokenId: string) => {
    await supabase
      .from("queue_tokens")
      .update({
        status: "serving",
        serving_started_at: new Date().toISOString(),
      })
      .eq("id", tokenId);
  };

  const completeToken = async (tokenId: string) => {
    await supabase
      .from("queue_tokens")
      .update({ status: "served", completed_at: new Date().toISOString() })
      .eq("id", tokenId);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Queue Management</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Waiting</p>
            <p className="text-2xl font-bold">{stats.waiting}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Serving</p>
            <p className="text-2xl font-bold">{stats.serving}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Served</p>
            <p className="text-2xl font-bold">{stats.served}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Total Today</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </Card>
        </div>
      )}

      {/* Token List */}
      <div className="space-y-3">
        {tokens
          .filter((t) => t.status !== "served" && t.status !== "cancelled")
          .map((token) => (
            <Card key={token.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">#{token.token_number}</p>
                  <p className="text-sm">{token.patient_name}</p>
                  <p className="text-xs text-gray-500">{token.patient_phone}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge
                    variant={
                      token.status === "waiting"
                        ? "secondary"
                        : token.status === "called"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {token.status}
                  </Badge>
                  {token.status === "waiting" && (
                    <Button onClick={() => callToken(token.id)}>Call</Button>
                  )}
                  {token.status === "called" && (
                    <Button onClick={() => startServing(token.id)}>
                      Start
                    </Button>
                  )}
                  {token.status === "serving" && (
                    <Button onClick={() => completeToken(token.id)}>
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
