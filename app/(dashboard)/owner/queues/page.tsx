"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import { Queue } from "@/lib/types";
import { toast } from "sonner";

export default function QueuesPage() {
  const { profile } = useAuth();
  const [queues, setQueues] = useState<Queue[]>([]);
  const supabase = createClient();

  const handleDeleteQueue = async (queueId: string, queueName: string) => {
    const confirmed = window.confirm(
      `Delete "${queueName}"? This will remove the queue and its data.`
    );
    if (!confirmed) return;

    const { error } = await supabase.from("queues").delete().eq("id", queueId);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Queue deleted");
    setQueues((prev) => prev.filter((q) => q.id !== queueId));
  };

  const loadQueues = async () => {
    if (!profile) return;

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("admin_id", profile.id)
      .single();

    if (business) {
      const { data } = await supabase
        .from("queues")
        .select("*, departments(name)")
        .eq("business_id", business.id);

      setQueues((data as Queue[]) || []);
    }
  };

  useEffect(() => {
    if (profile) {
      loadQueues();
    }
  }, [profile]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Queues"
        description="Manage queues for your business"
        action={
          <Link href="/owner/queues/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Queue
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {queues.map((queue) => (
          <Card key={queue.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{queue.name}</CardTitle>
                  {queue.departments && (
                    <p className="text-sm text-gray-500">
                      {queue.departments.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={queue.is_active ? "default" : "secondary"}>
                    {queue.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {queue.is_public !== false ? (
                    <Badge variant="outline">Public</Badge>
                  ) : (
                    <Badge variant="outline">Private</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {queue.image_url && (
                  <div className="aspect-[16/9] w-full overflow-hidden rounded-md border">
                    <img
                      src={queue.image_url}
                      alt={`${queue.name} queue`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                {queue.description && (
                  <p className="text-sm text-gray-600">{queue.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{queue.current_token_number}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{queue.estimated_wait_time}min</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/owner/queues/${queue.id}`}>
                    <Button variant="outline" className="w-full">
                      Manage Queue
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleDeleteQueue(queue.id, queue.name)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
