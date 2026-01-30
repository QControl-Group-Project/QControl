"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { QueueTokenCard } from "@/components/queue/QueueTokenCard";
import { EmptyState } from "@/components/layouts/EmptyState";
import { Ticket } from "lucide-react";
import { QueueToken } from "@/lib/types";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function PatientTokensPage() {
  const { profile } = useAuth();
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [deleteTokenId, setDeleteTokenId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const supabase = createClient();

  const handleDeleteToken = async (tokenId: string) => {
    const response = await fetch("/api/queue/delete-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      toast.error(body?.error || "Failed to delete token");
      return false;
    }

    toast.success("Token deleted");
    setTokens((prev) => prev.filter((token) => token.id !== tokenId));
    await loadTokens();
    return true;
  };

  const handleRequestDelete = (tokenId: string) => {
    setDeleteTokenId(tokenId);
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTokenId) return;
    const deleted = await handleDeleteToken(deleteTokenId);
    if (deleted) {
      setDeleteTokenId(null);
      setDialogOpen(false);
    }
  };

  const loadTokens = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from("queue_tokens")
      .select("*, queues(name), businesses(name)")
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tokens.map((token) => (
            <QueueTokenCard
              key={token.id}
              token={token}
              showTrackLink
              showDelete
              onDelete={handleRequestDelete}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setDeleteTokenId(null);
          }
        }}
        title="Delete token?"
        description="This will permanently remove the token."
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
      />
    </div>
  );
}
