"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { AppointmentList } from "@/components/appointments/AppointmentList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Appointment, Doctor } from "@/lib/types";

export default function DoctorAppointmentsPage() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const supabase = createClient();

  const loadDoctorAndAppointments = async () => {
    if (!profile) return;

    const { data: doctorData } = await supabase
      .from("doctors")
      .select("*")
      .eq("profile_id", profile.id)
      .single();

    setDoctor((doctorData as Doctor) || null);

    if (doctorData) {
      const { data } = await supabase
        .from("appointments")
        .select("*, hospitals(name)")
        .eq("doctor_id", doctorData.id)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      setAppointments((data as Appointment[]) || []);
    }
  };

  useEffect(() => {
    if (profile) {
      loadDoctorAndAppointments();
    }
  }, [profile]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (!error) {
      loadDoctorAndAppointments();
    }
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const todayAppointments = appointments.filter(
    (a) => a.appointment_date === today
  );
  const upcomingAppointments = appointments.filter(
    (a) => a.appointment_date > today
  );
  const pastAppointments = appointments.filter(
    (a) => a.appointment_date < today
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="My Appointments"
        description="Manage your appointments"
      />

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">
            Today ({todayAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          <AppointmentList
            appointments={todayAppointments}
            onUpdateStatus={updateStatus}
            showActions
            emptyMessage="No appointments today"
          />
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          <AppointmentList
            appointments={upcomingAppointments}
            onUpdateStatus={updateStatus}
            showActions
            emptyMessage="No upcoming appointments"
          />
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <AppointmentList
            appointments={pastAppointments}
            emptyMessage="No past appointments"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
