 "use client";

import { useParams } from "next/navigation";
import { TokenTrackingCard } from "@/components/queue/TokenTrackingCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TrackTokenPage() {
  const params = useParams<{ tokenId?: string | string[] }>();
  const tokenId = Array.isArray(params.tokenId)
    ? params.tokenId[0]
    : params.tokenId;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        {tokenId ? <TokenTrackingCard tokenId={tokenId} /> : null}
      </div>
    </div>
  );
}
