"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Doctor } from "@/lib/types";

export default function DoctorsPage() {
  const { profile } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadDoctors = async () => {
    if (!profile) return;

    const { data: hospital } = await supabase
      .from("hospitals")
      .select("id")
      .eq("admin_id", profile.id)
      .single();

    if (hospital) {
      const { data } = await supabase
        .from("doctors")
        .select("*, profiles(full_name, email), specializations(name)")
        .eq("hospital_id", hospital.id);

      setDoctors((data as Doctor[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile) {

      loadDoctors();
    }
  }, [profile]);

  const columns = [
    {
      key: "profiles.full_name",
      label: "Name",
      render: (d: Doctor) => d.profiles?.full_name ?? "-",
    },
    {
      key: "specializations.name",
      label: "Specialization",
      render: (d: Doctor) => d.specializations?.name || "-",
    },
    { key: "license_number", label: "License" },
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
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Doctors"
        description="Manage doctors in your hospital"
        action={
          <Link href="/admin/doctors/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Doctor
            </Button>
          </Link>
        }
      />

      <DataTable
        data={doctors}
        columns={columns}
        searchable
        searchPlaceholder="Search doctors..."
        onRowClick={(doctor) =>
          (window.location.href = `/admin/doctors/${doctor.id}`)
        }
      />
    </div>
  );
}
