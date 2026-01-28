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
import { Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 0",
          maskImage: `
            repeating-linear-gradient(to right, black 0px, black 3px, transparent 3px, transparent 8px),
            repeating-linear-gradient(to bottom, black 0px, black 3px, transparent 3px, transparent 8px),
            radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)
          `,
          WebkitMaskImage: `
            repeating-linear-gradient(to right, black 0px, black 3px, transparent 3px, transparent 8px),
            repeating-linear-gradient(to bottom, black 0px, black 3px, transparent 3px, transparent 8px),
            radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)
          `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">    
          <div className="flex justify-end mb-6">
            <ModeToggle />
          </div>
          
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-primary-foreground group-hover:scale-105 transition-transform overflow-hidden">
              <img src="/logo.png" alt="QControl logo" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-xl font-black uppercase tracking-[0.15em]">QControl</span>
          </Link>
          
          <div className="mb-6 flex items-center justify-center gap-2 border bg-muted/50 px-3 py-1 rounded-sm backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Token Tracker</span>
          </div>
        </div>
        
        <Card className="bg-card/95 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl">Track Your Token</CardTitle>
            <CardDescription>
              Enter your token ID to check your position in the queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="tokenId" className="text-sm font-medium">Token ID</Label>
                <Input
                  id="tokenId"
                  placeholder="Enter token ID"
                  className="mt-2 h-11"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground mt-2">
                  You can find this on your token receipt or QR code
                </p>
              </div>
              <Button type="submit" className="w-full h-11">
                <Search className="h-4 w-4 mr-2" />
                Track Token
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TrackTokenPage() {
  return <TrackTokenSearch />;
}
