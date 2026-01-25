"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { AppointmentList } from "@/components/appointments/AppointmentList";
import { Appointment } from "@/lib/types";

export default function AdminAppointmentsPage() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadAppointments = async () => {
    if (!profile) return;

    const { data: hospital } = await supabase
      .from("hospitals")
      .select("id")
      .eq("admin_id", profile.id)
      .single();

    if (!hospital) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("appointments")
      .select("*, doctors(profiles(full_name)), hospitals(name)")
      .eq("hospital_id", hospital.id)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    setAppointments((data as Appointment[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) {
      loadAppointments();
    }
  }, [profile]);

  const updateStatus = async (appointmentId: string, status: string) => {
    const updateData: Partial<Appointment> & {
      status: Appointment["status"];
    } = { status: status as Appointment["status"] };

    if (status === "confirmed") {
      updateData.confirmed_at = new Date().toISOString();
    } else if (status === "in-progress") {
      updateData.started_at = new Date().toISOString();
    } else if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    } else if (status === "cancelled") {
      updateData.cancelled_at = new Date().toISOString();
    }

    await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId);

    loadAppointments();
  };

  const cancelAppointment = async (appointmentId: string) => {
    await updateStatus(appointmentId, "cancelled");
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Appointments"
        description="Track appointments across your hospital"
      />

      <AppointmentList
        appointments={appointments}
        onUpdateStatus={updateStatus}
        onCancel={cancelAppointment}
        showActions={!loading}
        emptyMessage="No appointments yet"
      />
    </div>
  );
}

