"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Doctor } from "@/lib/types";
import { toast } from "sonner";

export default function DoctorsPage() {
  const { profile } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const supabase = createClient();

  const loadDoctors = async () => {
    if (!profile) return;

    const { data: business } = await supabase
      .from("businesses")
      .select("id, business_type")
      .eq("admin_id", profile.id)
      .single();

    if (business) {
      setBusinessType(business.business_type ?? null);
      const { data } = await supabase
        .from("doctors")
        .select("*, profiles(full_name, email), specializations(name)")
        .eq("business_id", business.id);

      setDoctors((data as Doctor[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile) {

      loadDoctors();
    }
  }, [profile]);

  const handleDeleteDoctor = async (doctorId: string, name?: string) => {
    const confirmed = window.confirm(
      `Delete ${name ?? "this provider"}? This action cannot be undone.`
    );
    if (!confirmed) return;

    const { error } = await supabase.from("doctors").delete().eq("id", doctorId);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Provider deleted");
    setDoctors((prev) => prev.filter((item) => item.id !== doctorId));
  };

  const columns = [
    {
      key: "profiles.full_name",
      label: "Name",
      render: (d: Doctor) => d.profiles?.full_name ?? "-",
    },
    {
      key: "specializations.name",
      label: "Specialty",
      render: (d: Doctor) => d.specializations?.name || "-",
    },
    { key: "license_number", label: "License/ID" },
    {
      key: "experience_years",
      label: "Experience",
      render: (d: Doctor) => `${d.experience_years || 0} years`,
    },
    {
      key: "is_available",
      label: "Status",
      render: (d: Doctor) => (
        <Badge variant={d.is_available ? "default" : "secondary"}>
          {d.is_available ? "Available" : "Unavailable"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Delete",
      render: (d: Doctor) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDeleteDoctor(d.id, d.profiles?.full_name)}
          aria-label={`Delete ${d.profiles?.full_name ?? "provider"}`}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      ),
    },
  ];

  const providerLabel = "Provider";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`${providerLabel}s`}
        description={`Manage ${providerLabel.toLowerCase()}s in your business`}
        action={
          <Link href="/owner/provider/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add {providerLabel}
            </Button>
          </Link>
        }
      />

      <DataTable
        data={doctors}
        columns={columns}
        searchable
        searchPlaceholder={`Search ${providerLabel.toLowerCase()}s...`}
      />
    </div>
  );
}
