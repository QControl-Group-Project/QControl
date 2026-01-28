"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueueTokenForm } from "@/components/forms/QueueTokenForm";
import { LoadingSpinner } from "@/components/layouts/loadingSpinner";
import { RealtimeQueueDisplay } from "@/components/queue/RealtimeQueueDisplay";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ArrowLeft, MapPin, Ticket, Monitor, Clock, Users } from "lucide-react";
import { Business, Queue, QueueToken } from "@/lib/types";

export default function QueueTokenPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [generatedToken, setGeneratedToken] = useState<QueueToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("get-token");
  const qrWrapperRef = useRef<HTMLDivElement | null>(null);
  
  const supabase = createClient();
  const params = useParams<{ businessId?: string | string[] }>();
  const searchParams = useSearchParams();
  const businessId = Array.isArray(params.businessId)
    ? params.businessId[0]
    : params.businessId;

  
  const preselectedQueue = searchParams.get("queue");

  const loadData = async () => {
    if (!businessId) return;
    const [businessData, queuesData] = await Promise.all([
      supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single(),
      supabase
        .from("queues")
        .select("*, departments(name)")
        .eq("business_id", businessId)
        .eq("is_active", true),
    ]);

    setBusiness((businessData.data as Business) || null);
    setQueues((queuesData.data as Queue[]) || []);
    
    
    if (preselectedQueue) {
      setSelectedQueue(preselectedQueue);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (!businessId) return;
    loadData();
  }, [businessId, preselectedQueue]);

  const qrValue = useMemo(() => {
    if (!generatedToken) return "";
    if (typeof window === "undefined") return generatedToken.id;
    return `${window.location.origin}/track-token/${generatedToken.id}`;
  }, [generatedToken]);

  const handleDownloadQr = () => {
    const svg = qrWrapperRef.current?.querySelector("svg");
    if (!svg || !generatedToken) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    if (!source.includes("xmlns=")) {
      source = source.replace(
        "<svg",
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
    }

    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `queue-token-${generatedToken.token_number}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner />;

  
  if (generatedToken) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-slate-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md border-green-200">
          <CardHeader className="text-center bg-green-600 text-white rounded-t-lg">
            <div className="text-7xl font-bold mb-2">
              #{generatedToken.token_number}
            </div>
            <CardTitle className="text-xl">Token Generated!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="text-center">
              <p className="font-semibold text-lg mb-1">
                {generatedToken.patient_name}
              </p>
              <p className="text-gray-600">
                {generatedToken.queues?.name ?? "Queue"}
              </p>
              <div className="flex items-center justify-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  ~{(generatedToken.queues?.estimated_wait_time || 5)} min/patient
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <div
                ref={qrWrapperRef}
                className="bg-white p-4 rounded-xl shadow-md border"
              >
                <QRCode value={qrValue || generatedToken.id} size={180} />
              </div>
            </div>

            <Button variant="outline" onClick={handleDownloadQr}>
              Download QR
            </Button>

            <p className="text-sm text-center text-gray-600">
              Scan this QR code or use the token number to track your position
            </p>

            <div className="space-y-3">
              <Link href={`/track-token/${generatedToken.id}`}>
                <Button className="w-full" size="lg">
                  <Monitor className="h-4 w-4 mr-2" />
                  Track My Token Live
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setGeneratedToken(null);
                  setSelectedQueue("");
                }}
              >
                <Ticket className="h-4 w-4 mr-2" />
                Get Another Token
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            {business && (
              <div className="text-right">
                <p className="font-semibold">{business.name}</p>
                {business.address && (
                  <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                    <MapPin className="h-3 w-3" />
                    {business.address}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 py-6">
        {queues.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">
              Select Queue
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {queues.map((q) => (
                <Card 
                  key={q.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedQueue === q.id 
                      ? "border-blue-500 border-2 bg-blue-50" 
                      : "hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedQueue(q.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{q.name}</p>
                        {q.departments?.name && (
                          <p className="text-sm text-gray-500">{q.departments.name}</p>
                        )}
                      </div>
                      <Badge variant={q.is_active ? "default" : "secondary"}>
                        {q.is_active ? "Open" : "Closed"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {q.current_token_number} tokens today
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        ~{q.estimated_wait_time}min wait
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedQueue && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="get-token" className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Get Token
              </TabsTrigger>
              <TabsTrigger value="view-queue" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                View Queue
              </TabsTrigger>
            </TabsList>

            <TabsContent value="get-token">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Get Queue Token
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {businessId && (
                    <QueueTokenForm
                      queueId={selectedQueue}
                      businessId={businessId}
                      onSuccess={setGeneratedToken}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="view-queue">
              <RealtimeQueueDisplay queueId={selectedQueue} />
            </TabsContent>
          </Tabs>
        )}

        {queues.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">No Active Queues</p>
              <p className="text-gray-600 mt-2">
                There are no active queues at this business right now.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
