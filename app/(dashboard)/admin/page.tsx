"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";
import { Users, Calendar, Clock, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Appointment, Hospital, Queue } from "@/lib/types";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalStaff: 0,
    totalQueues: 0,
    todayAppointments: 0,
    todayTokens: 0,
    activeTokens: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>(
    []
  );
  const [activeQueues, setActiveQueues] = useState<Queue[]>([]);
  
  const supabase = getSupabaseClient();

  useEffect(() => {
    const loadHospitalAndStats = async () => {
      if (!profile) return;

      try {
        const { data: hospitalData, error: hospitalError } = await supabase
          .from("hospitals")
          .select("*")
          .eq("admin_id", profile.id)
          .single();

        if (hospitalError) {
          console.error("Error loading hospital:", hospitalError);
          return;
        }

        if (hospitalData) {
          setHospital(hospitalData as Hospital);

          const today = new Date().toISOString().split("T")[0];

          const [
            doctors,
            staff,
            queues,
            appointments,
            tokens,
            activeTokensData,
            activeQueuesData,
            recentAppts,
          ] = await Promise.all([
            supabase
              .from("doctors")
              .select("*", { count: "exact", head: true })
              .eq("hospital_id", hospitalData.id),
            supabase
              .from("staff_assignments")
              .select("*", { count: "exact", head: true })
              .eq("hospital_id", hospitalData.id),
            supabase
              .from("queues")
              .select("*", { count: "exact", head: true })
              .eq("hospital_id", hospitalData.id),
            supabase
              .from("appointments")
              .select("*", { count: "exact", head: true })
              .eq("hospital_id", hospitalData.id)
              .eq("appointment_date", today),
            supabase
              .from("queue_tokens")
              .select("*", { count: "exact", head: true })
              .eq("hospital_id", hospitalData.id)
              .gte("created_at", today),
            supabase
              .from("queue_tokens")
              .select("*", { count: "exact", head: true })
              .eq("hospital_id", hospitalData.id)
              .in("status", ["waiting", "called", "serving"]),
            supabase
              .from("queues")
              .select("*, departments(name)")
              .eq("hospital_id", hospitalData.id)
              .eq("is_active", true)
              .limit(5),
            supabase
              .from("appointments")
              .select("*, doctors(profiles(full_name))")
              .eq("hospital_id", hospitalData.id)
              .gte("appointment_date", today)
              .order("appointment_date", { ascending: true })
              .limit(5),
          ]);

          setStats({
            totalDoctors: doctors.count || 0,
            totalStaff: staff.count || 0,
            totalQueues: queues.count || 0,
            todayAppointments: appointments.count || 0,
            todayTokens: tokens.count || 0,
            activeTokens: activeTokensData.count || 0,
          });

          setActiveQueues((activeQueuesData.data as Queue[]) || []);
          setRecentAppointments((recentAppts.data as Appointment[]) || []);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };

    if (profile) {
      loadHospitalAndStats();
    }
  }, [profile, supabase]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Welcome back, {profile?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDoctors}</div>
            <p className="text-xs text-gray-500">Active physicians</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-gray-500">Support staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-gray-500">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Tokens</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTokens}</div>
            <p className="text-xs text-gray-500">In queue now</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between border-b pb-3 last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{apt.patient_name}</p>
                    <p className="text-sm text-gray-500">
                      Dr. {apt.doctors?.profiles?.full_name ?? "Not assigned"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(apt.appointment_date), "MMM dd, yyyy")}{" "}
                      at {apt.appointment_time}
                    </p>
                  </div>
                  <Badge
                    variant={
                      apt.status === "completed"
                        ? "default"
                        : apt.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {apt.status}
                  </Badge>
                </div>
              ))}
              {recentAppointments.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No appointments found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Queues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeQueues.map((queue) => (
                <div
                  key={queue.id}
                  className="flex items-center justify-between border-b pb-3 last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{queue.name}</p>
                    <p className="text-sm text-gray-500">
                      {queue.departments?.name || "General"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {queue.current_token_number}
                    </p>
                    <p className="text-xs text-gray-500">Current token</p>
                  </div>
                </div>
              ))}
              {activeQueues.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No active queues
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}