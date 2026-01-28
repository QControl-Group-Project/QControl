"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Business, Queue } from "@/lib/types";
import { LoadingSpinner } from "@/components/layouts/loadingSpinner";
import { MapPin, Search, Timer } from "lucide-react";

export default function QueueBusinessSelectPage() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  const loadQueues = async () => {
    try {
      const { data } = await supabase
        .from("queues")
        .select(
          `
            id,
            name,
            description,
            image_url,
            estimated_wait_time,
            current_token_number,
            business_id,
            is_public,
            businesses (
              id,
              name,
              address,
              city,
              state,
              business_type,
              business_type_custom
            )
          `
        )
        .eq("is_active", true)
        .eq("is_public", true)
        .order("name", { ascending: true });

      setQueues((data as Queue[]) || []);
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        console.error("Failed to load queues:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueues();
  }, []);

  const filteredQueues = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return queues;
    return queues.filter((queue) => {
      const business = queue.businesses as Business | undefined;
      return (
        queue.name.toLowerCase().includes(query) ||
        business?.name?.toLowerCase().includes(query) ||
        business?.city?.toLowerCase().includes(query) ||
        business?.state?.toLowerCase().includes(query)
      );
    });
  }, [queues, searchTerm]);

  if (loading) {
    return <LoadingSpinner text="Loading queues..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Discover Queues</h1>
          <p className="text-sm text-gray-600">
            Browse public queues across businesses and join instantly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by queue or business name..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filteredQueues.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">
                No public queues are available right now.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredQueues.map((queue) => {
              const business = queue.businesses as Business | undefined;
              const businessType =
                business?.business_type === "custom"
                  ? business?.business_type_custom
                  : business?.business_type;

              return (
                <Card key={queue.id} className="flex flex-col">
                <CardHeader>
                    {queue.image_url && (
                      <div className="mb-3 aspect-[16/9] w-full overflow-hidden rounded-md border">
                        <img
                          src={queue.image_url}
                          alt={`${queue.name} queue`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardTitle className="flex items-start justify-between gap-3">
                      <span>{queue.name}</span>
                      {businessType && (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          {businessType}
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {business?.name ?? "Business"}
                    </p>
                </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-4">
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-blue-600" />
                        <span>
                          {business?.address ??
                            ([business?.city, business?.state]
                              .filter(Boolean)
                              .join(", ") ||
                              "Address not available")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Timer className="h-4 w-4" />
                        <span>
                          Est. wait {queue.estimated_wait_time} min • Current{" "}
                          {queue.current_token_number}
                        </span>
                      </div>
                  </div>
                    <Link href={`/queue/${queue.business_id}?queue=${queue.id}`}>
                      <Button className="w-full">Join Queue</Button>
                  </Link>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

