"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";

export default function DashboardRedirectPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const role = profile?.role ?? "patient";
    const redirectMap: Record<string, string> = {
      admin: "/admin",
      doctor: "/doctor",
      staff: "/staff",
      patient: "/patient",
    };

    router.replace(redirectMap[role] ?? "/patient");
  }, [profile, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">Redirecting...</div>
    </div>
  );
}

