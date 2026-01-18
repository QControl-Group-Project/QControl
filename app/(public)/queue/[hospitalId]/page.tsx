"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueueTokenForm } from "@/components/forms/QueueTokenForm";
import { LoadingSpinner } from "@/components/layouts/loadingSpinner";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Hospital, Queue, QueueToken } from "@/lib/types";

export default function QueueTokenPage({
  params,
}: {
  params: { hospitalId: string };
}) {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [generatedToken, setGeneratedToken] = useState<QueueToken | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadData = async () => {
    const [hospitalData, queuesData] = await Promise.all([
      supabase
        .from("hospitals")
        .select("*")
        .eq("id", params.hospitalId)
        .single(),
      supabase
        .from("queues")
        .select("*, departments(name)")
        .eq("hospital_id", params.hospitalId)
        .eq("is_active", true),
    ]);

    setHospital((hospitalData.data as Hospital) || null);
    setQueues((queuesData.data as Queue[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (generatedToken) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-6xl font-bold text-blue-600 mb-4">
              #{generatedToken.token_number}
            </div>
            <CardTitle>Token Generated Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="font-semibold mb-2">
                {generatedToken.patient_name}
              </p>
              <p className="text-sm text-gray-600">
                {generatedToken.queues?.name ?? "Queue"}
              </p>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <QRCode value={generatedToken.id} size={200} />
              </div>
            </div>

            <p className="text-sm text-center text-gray-600">
              Save this QR code or token number to track your position
            </p>

            <div className="space-y-2">
              <Link href={`/track-token/${generatedToken.id}`}>
                <Button className="w-full">Track My Token</Button>
              </Link>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setGeneratedToken(null)}
              >
                Generate Another Token
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        {hospital && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h1 className="text-2xl font-bold mb-2">{hospital.name}</h1>
                  {hospital.address && (
                    <p className="text-gray-600">{hospital.address}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Get Queue Token</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Select Queue
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedQueue}
                onChange={(e) => setSelectedQueue(e.target.value)}
              >
                <option value="">Choose a queue...</option>
                {queues.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name} {q.departments?.name && `- ${q.departments.name}`}
                  </option>
                ))}
              </select>
            </div>

            {selectedQueue && (
              <QueueTokenForm
                queueId={selectedQueue}
                hospitalId={params.hospitalId}
                onSuccess={setGeneratedToken}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
