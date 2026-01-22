"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Clock, Ticket, Plus, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/layouts/loadingSpinner";
import { Appointment, QueueToken } from "@/lib/types";
export default function PatientDashboard() {
  const { profile } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [activeTokens, setActiveTokens] = useState<QueueToken[]>([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    activeTokens: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadPatientData = async () => {
    if (!profile) return;

    try {
      const today = new Date().toISOString().split("T")[0];

      const { data: appointments } = await supabase
        .from("appointments")
        .select(
          "*, doctors(profiles(full_name), specializations(name)), hospitals(name, address)"
        )
        .eq("patient_id", profile.id)
        .gte("appointment_date", today)
        .in("status", ["scheduled", "confirmed"])
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true })
        .limit(5);

      setUpcomingAppointments((appointments as Appointment[]) || []);

      const { data: tokens } = await supabase
        .from("queue_tokens")
        .select(
          "*, queues(name, estimated_wait_time), hospitals(name, address)"
        )
        .eq("patient_id", profile.id)
        .in("status", ["waiting", "called", "serving"])
        .order("created_at", { ascending: false });

      setActiveTokens((tokens as QueueToken[]) || []);

      const [totalAppts, completedAppts, upcomingAppts, activeTokensCount] =
        await Promise.all([
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", profile.id),
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", profile.id)
            .eq("status", "completed"),
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", profile.id)
            .gte("appointment_date", today)
            .in("status", ["scheduled", "confirmed"]),
          supabase
            .from("queue_tokens")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", profile.id)
            .in("status", ["waiting", "called", "serving"]),
        ]);

      setStats({
        totalAppointments: totalAppts.count || 0,
        completedAppointments: completedAppts.count || 0,
        upcomingAppointments: upcomingAppts.count || 0,
        activeTokens: activeTokensCount.count || 0,
      });
    } catch (error) {
      console.error("Error loading patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      loadPatientData();
    }
  }, [profile]);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patient Dashboard</h1>
        <p className="text-gray-500">Welcome back, {profile?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/appointments">
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="font-semibold text-lg mb-1">Book Appointment</h3>
                <p className="text-sm text-gray-500">
                  Schedule a visit with a doctor
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/queue/select">
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="font-semibold text-lg mb-1">Get Queue Token</h3>
                <p className="text-sm text-gray-500">Join a hospital queue</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Ticket className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-gray-500">All time</p>
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
            <p className="text-xs text-gray-500">Scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedAppointments}
            </div>
            <p className="text-xs text-gray-500">Total completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Tokens</CardTitle>
            <Ticket className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTokens}</div>
            <p className="text-xs text-gray-500">In queue</p>
          </CardContent>
        </Card>
      </div>

      {activeTokens.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Queue Tokens</CardTitle>
            <Link href="/patient/tokens">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeTokens.map((token) => (
                <Card
                  key={token.id}
                  className="border-2 border-blue-200 bg-blue-50/50"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">
                            #{token.token_number}
                          </div>
                          <Badge
                            variant={
                              token.status === "waiting"
                                ? "secondary"
                                : token.status === "called"
                                  ? "default"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {token.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-semibold">
                            {token.hospitals?.name ?? "Hospital"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {token.queues?.name ?? "Queue"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Est. wait:{" "}
                            {token.queues?.estimated_wait_time ?? 0}min per person
                          </p>
                        </div>
                      </div>
                      <Link href={`/track-token/${token.id}`}>
                        <Button size="sm">Track</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Appointments</CardTitle>
          <Link href="/patient/appointments">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No upcoming appointments</p>
              <Link href="/appointments">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Book Your First Appointment
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <Card
                  key={apt.id}
                  className="border hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded font-semibold text-sm">
                            {format(
                              new Date(apt.appointment_date),
                              "MMM dd, yyyy"
                            )}
                          </div>
                          <div className="bg-gray-100 px-3 py-1 rounded text-sm font-medium">
                            {apt.appointment_time.substring(0, 5)}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold">
                              Dr. {apt.doctors?.profiles?.full_name ?? "Not set"}
                            </span>
                            <span className="text-sm text-gray-500">
                              • {apt.doctors?.specializations?.name ?? "Specialty"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{apt.hospitals?.name ?? "Hospital"}</span>
                          </div>

                          {apt.symptoms && (
                            <p className="text-sm text-gray-600 mt-2">
                              Reason: {apt.symptoms}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 items-end">
                        <Badge
                          variant={
                            apt.status === "confirmed" ? "default" : "secondary"
                          }
                        >
                          {apt.status}
                        </Badge>
                        <Link href={`/patient/appointments/${apt.id}`}>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
