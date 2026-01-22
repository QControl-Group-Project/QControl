import { TokenTrackingCard } from "@/components/queue/TokenTrackingCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TrackTokenPage({
  params,
}: {
  params: { tokenId: string };
}) {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <TokenTrackingCard tokenId={params.tokenId} />
      </div>
    </div>
  );
}
