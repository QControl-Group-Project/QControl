"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Clock } from "lucide-react";
import Link from "next/link";
import { Queue } from "@/lib/types";

export default function QueuesPage() {
  const { profile } = useAuth();
  const [queues, setQueues] = useState<Queue[]>([]);
  const supabase = createClient();

  const loadQueues = async () => {
    if (!profile) return;

    const { data: hospital } = await supabase
      .from("hospitals")
      .select("id")
      .eq("admin_id", profile.id)
      .single();

    if (hospital) {
      const { data } = await supabase
        .from("queues")
        .select("*, departments(name)")
        .eq("hospital_id", hospital.id);

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
        description="Manage queues in your hospital"
        action={
          <Link href="/admin/queues/new">
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
                <Badge variant={queue.is_active ? "default" : "secondary"}>
                  {queue.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
                <Link href={`/admin/queues/${queue.id}`}>
                  <Button variant="outline" className="w-full">
                    Manage Queue
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
