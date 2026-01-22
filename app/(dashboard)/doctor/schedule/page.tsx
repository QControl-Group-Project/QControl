"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { DoctorScheduleEditor } from "@/components/appointments/DoctorScheduleEditor";
import { LoadingSpinner } from "@/components/layouts/loadingSpinner";
import { Doctor } from "@/lib/types";

export default function DoctorSchedulePage() {
  const { profile } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadDoctor = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from("doctors")
      .select("*")
      .eq("profile_id", profile.id)
      .single();

    setDoctor((data as Doctor) || null);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) {
      loadDoctor();
    }
  }, [profile]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="My Schedule"
        description="Manage your weekly working hours"
      />

      {doctor && <DoctorScheduleEditor doctorId={doctor.id} />}
    </div>
  );
}
