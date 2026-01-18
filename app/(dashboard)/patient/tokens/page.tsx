"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { QueueTokenCard } from "@/components/queue/QueueTokenCard";
import { EmptyState } from "@/components/layouts/EmptyState";
import { Ticket } from "lucide-react";
import { QueueToken } from "@/lib/types";

export default function PatientTokensPage() {
  const { profile } = useAuth();
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const supabase = createClient();

  const loadTokens = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from("queue_tokens")
      .select("*, queues(name), hospitals(name)")
      .eq("patient_id", profile.id)
      .order("created_at", { ascending: false });

    setTokens((data as QueueToken[]) || []);
  };

  useEffect(() => {
    if (profile) {
      loadTokens();
    }
  }, [profile]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="My Tokens" description="View all your queue tokens" />

      {tokens.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No tokens found"
          description="You haven't generated any queue tokens yet"
        />
      ) : (
        <div className="space-y-4">
          {tokens.map((token) => (
            <QueueTokenCard key={token.id} token={token} />
          ))}
        </div>
      )}
    </div>
  );
}
