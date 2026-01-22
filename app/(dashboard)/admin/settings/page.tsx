"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layouts/PageHeader";

export default function AdminSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/hospital");
  }, [router]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Settings"
        description="Redirecting to hospital settings"
      />
      <div className="text-sm text-gray-500">Loading settings...</div>
    </div>
  );
}

