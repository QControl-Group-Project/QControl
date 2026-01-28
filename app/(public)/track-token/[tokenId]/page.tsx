"use client";

import { useParams } from "next/navigation";
import { TokenTrackerRealtime } from "@/components/queue/TokenTrackerRealtime";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, BellRing } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function TrackTokenPage() {
  const params = useParams<{ tokenId?: string | string[] }>();
  const tokenId = Array.isArray(params.tokenId) ? params.tokenId[0] : params.tokenId;
  const { toast } = useToast();

  const handleStatusChange = (status: string) => {
    const messages: Record<string, { title: string; description: string }> = {
      called: { title: "🔔 Your Token is Called!", description: "Please proceed to the counter immediately." },
      serving: { title: "✅ Now Serving", description: "You are currently being served." },
      served: { title: "🎉 Complete", description: "Thank you for your visit!" },
      skipped: { title: "⚠️ Token Skipped", description: "Please contact staff for assistance." },
    };

    if (messages[status]) {
      toast({ ...messages[status], duration: 5000 });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-8">
          <Link href="/customer">
            <Button variant="ghost" size="sm" className="hover:bg-accent">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Live Updates</span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
        </header>

        <section className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            Track Your Token
          </h1>
          <p className="text-muted-foreground">
            We'll notify you when it's your turn
          </p>
        </section>

        <main className="relative">
          {tokenId ? (
            <div className="rounded-2xl border bg-card/50 backdrop-blur-sm shadow-xl p-1">
              <TokenTrackerRealtime 
                tokenId={tokenId} 
                onStatusChange={handleStatusChange}
              />
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
              <p className="text-muted-foreground font-medium">Invalid token ID</p>
              <Link href="/">
                <Button variant="outline" className="mt-4">Return Home</Button>
              </Link>
            </div>
          )}
        </main>

        
        <footer className="mt-10 px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2 text-primary">
              <BellRing className="h-4 w-4 animate-bounce" />
              <span className="text-xs font-semibold uppercase tracking-wide">Stay Updated</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
              Keep this page open. We suggest enabling <span className="text-foreground font-medium">browser notifications</span> for the best experience.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}