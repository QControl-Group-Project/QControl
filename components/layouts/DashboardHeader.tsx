"use client";

import { Bell, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/hooks/use-auth";
import { getInitials } from "@/lib/utils";

export function DashboardHeader() {
  const { profile } = useAuth();

  return (
    <header className="border-b border-border/70 bg-background/80 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers, queues, or schedules..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>
              {getInitials(profile?.full_name || "")}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
