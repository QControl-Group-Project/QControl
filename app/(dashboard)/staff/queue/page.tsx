"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layouts/EmptyState";
import Link from "next/link";
import { Queue } from "@/lib/types";
import { ClipboardList } from "lucide-react";

export default function StaffQueueIndexPage() {
  const { profile } = useAuth();
  const [queues, setQueues] = useState<Queue[]>([]);
  const supabase = createClient();

  const loadQueues = async () => {
    if (!profile) return;

    const { data: assignments } = await supabase
      .from("queue_staff_assignments")
      .select("queues(*)")
      .eq("staff_id", profile.id)
      .eq("is_active", true);

    const list =
      (assignments as { queues: Queue | null }[] | null)
        ?.map((row) => row.queues)
        .filter((q): q is Queue => !!q) ?? [];

    setQueues(list);
  };

  useEffect(() => {
    if (profile) {
      loadQueues();
    }
  }, [profile]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Manage Queue"
        description="Select a queue to manage tokens"
      />
      {queues.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No queues assigned"
          description="Ask your hospital admin to assign you a queue."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queues.map((queue) => (
            <Card key={queue.id}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="font-semibold">{queue.name}</p>
                  {queue.description && (
                    <p className="text-sm text-gray-500">{queue.description}</p>
                  )}
                </div>
                <Link href={`/staff/queue/${queue.id}`}>
                  <Button className="w-full">Open Queue</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

