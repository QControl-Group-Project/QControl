"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hospital } from "@/lib/types";
import { LoadingSpinner } from "@/components/layouts/loadingSpinner";
import { MapPin } from "lucide-react";

export default function QueueHospitalSelectPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadHospitals = async () => {
    try {
      const { data: activeQueues } = await supabase
        .from("queues")
        .select("hospital_id")
        .eq("is_active", true);

      const hospitalIds =
        activeQueues?.map((queue) => queue.hospital_id).filter(Boolean) || [];

      if (hospitalIds.length === 0) {
        setHospitals([]);
        return;
      }

      const { data } = await supabase
        .from("hospitals")
        .select("*")
        .in("id", hospitalIds)
        .eq("is_active", true)
        .order("name", { ascending: true });

      setHospitals((data as Hospital[]) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading hospitals..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Select a Hospital</h1>
          <p className="text-sm text-gray-600">
            Choose a hospital to view its active queues.
          </p>
        </div>

        {hospitals.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600">
                No hospitals with active queues are available right now.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {hospitals.map((hospital) => (
              <Card key={hospital.id}>
                <CardHeader>
                  <CardTitle>{hospital.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 text-blue-600" />
                    <span>{hospital.address ?? "Address not available"}</span>
                  </div>
                  <Link href={`/queue/${hospital.id}`}>
                    <Button>View Queues</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

