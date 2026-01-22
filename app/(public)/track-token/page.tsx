"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

export function TrackTokenSearch() {
  const [tokenId, setTokenId] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenId.trim()) {
      router.push(`/track-token/${tokenId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Track Your Token</CardTitle>
          <CardDescription>
            Enter your token ID to check your position in the queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tokenId">Token ID</Label>
              <Input
                id="tokenId"
                placeholder="Enter token ID"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                You can find this on your token receipt or QR code
              </p>
            </div>
            <Button type="submit" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Track Token
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TrackTokenPage() {
  return <TrackTokenSearch />;
}
