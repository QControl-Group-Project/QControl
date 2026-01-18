"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Appointment, Doctor } from "@/lib/types";

export default function DoctorDashboard() {
  const { profile } = useAuth();
  const [doctorInfo, setDoctorInfo] = useState<Doctor | null>(null);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedToday: 0,
    totalPatients: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const supabase = createClient();

  const loadDoctorData = async () => {
    if (!profile) return;

    const { data: doctor } = await supabase
      .from("doctors")
      .select("*, hospitals(name), specializations(name)")
      .eq("profile_id", profile.id)
      .single();

    if (doctor) {
      setDoctorInfo(doctor as Doctor);
      const today = new Date().toISOString().split("T")[0];

      const [todayAppts, upcoming, completed, patients, todayApptsList] =
        await Promise.all([
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("doctor_id", doctor.id)
            .eq("appointment_date", today),
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("doctor_id", doctor.id)
            .gte("appointment_date", today)
            .in("status", ["scheduled", "confirmed"]),
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("doctor_id", doctor.id)
            .eq("appointment_date", today)
            .eq("status", "completed"),
          supabase
            .from("appointments")
            .select("patient_id", { count: "exact", head: true })
            .eq("doctor_id", doctor.id)
            .not("patient_id", "is", null),
          supabase
            .from("appointments")
            .select("*")
            .eq("doctor_id", doctor.id)
            .eq("appointment_date", today)
            .order("appointment_time", { ascending: true }),
        ]);

      setStats({
        todayAppointments: todayAppts.count || 0,
        upcomingAppointments: upcoming.count || 0,
        completedToday: completed.count || 0,
        totalPatients: patients.count || 0,
      });

      setTodayAppointments((todayApptsList.data as Appointment[]) || []);
    }
  };

  useEffect(() => {
    if (profile) {
      loadDoctorData();
    }
  }, [profile]);

  const updateAppointmentStatus = async (
    appointmentId: string,
    status: string
  ) => {
    const updateData: Partial<Appointment> & {
      status: Appointment["status"];
    } = { status: status as Appointment["status"] };

    if (status === "in-progress") {
      updateData.started_at = new Date().toISOString();
    } else if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId);

    loadDoctorData();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <p className="text-gray-500">
          {doctorInfo?.specializations?.name} at {doctorInfo?.hospitals?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.upcomingAppointments}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between border-b pb-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded font-medium">
                      {apt.appointment_time.substring(0, 5)}
                    </div>
                    <div>
                      <p className="font-medium">{apt.patient_name}</p>
                      <p className="text-sm text-gray-500">
                        {apt.patient_age} years • {apt.appointment_type}
                      </p>
                      {apt.symptoms && (
                        <p className="text-sm text-gray-600 mt-1">
                          Symptoms: {apt.symptoms}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      apt.status === "completed"
                        ? "default"
                        : apt.status === "in-progress"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {apt.status}
                  </Badge>
                  {apt.status === "confirmed" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateAppointmentStatus(apt.id, "in-progress")
                      }
                    >
                      Start
                    </Button>
                  )}
                  {apt.status === "in-progress" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateAppointmentStatus(apt.id, "completed")
                      }
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {todayAppointments.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No appointments scheduled for today
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
