"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { LoadingSpinner } from "@/components/layouts/loadingSpinner";
import { Appointment, Queue, QueueToken, StaffAssignment } from "@/lib/types";
export default function StaffDashboard() {
  const { profile } = useAuth();
  const [assignment, setAssignment] = useState<StaffAssignment | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [stats, setStats] = useState({
    activeTokens: 0,
    servedToday: 0,
    waitingTokens: 0,
    averageWaitTime: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadStaffData = async () => {
    if (!profile) return;

    try {
      const { data: staffAssignment } = await supabase
        .from("staff_assignments")
        .select("*, hospitals(name, address)")
        .eq("staff_id", profile.id)
        .eq("is_active", true)
        .single();

      if (staffAssignment) {
        setAssignment(staffAssignment as StaffAssignment);

        const { data: queueAssignments } = await supabase
          .from("queue_staff_assignments")
          .select("*, queues(*)")
          .eq("staff_id", profile.id)
          .eq("is_active", true);

        const queuesData =
          (queueAssignments as { queues: Queue }[] | null)?.map(
            (qa) => qa.queues
          ) || [];
        setQueues(queuesData);

        const today = new Date().toISOString().split("T")[0];
        const queueIds = queuesData.map((q) => q.id);

        if (queueIds.length > 0) {
          const { data: tokens } = await supabase
            .from("queue_tokens")
            .select("*")
            .in("queue_id", queueIds)
            .gte("created_at", today);

          const typedTokens = (tokens as QueueToken[]) || [];
          const activeTokens = typedTokens.filter((t) =>
            ["waiting", "called", "serving"].includes(t.status)
          ).length;

          const servedTokens = typedTokens.filter(
            (t) => t.status === "served"
          ).length;
          const waitingTokens = typedTokens.filter(
            (t) => t.status === "waiting"
          ).length;

          const servedWithTimes = typedTokens.filter(
            (
              t
            ): t is QueueToken & { completed_at: string; created_at: string } =>
              t.status === "served" && !!t.completed_at && !!t.created_at
          );

          const avgWait =
            servedWithTimes.length > 0
              ? servedWithTimes.reduce((acc, t) => {
                  const wait =
                    (new Date(t.completed_at).getTime() -
                      new Date(t.created_at).getTime()) /
                    60000;
                  return acc + wait;
                }, 0) / servedWithTimes.length
              : 0;

          setStats({
            activeTokens,
            servedToday: servedTokens,
            waitingTokens,
            averageWaitTime: Math.round(avgWait),
          });
        }

        const { data: appointments } = await supabase
          .from("appointments")
          .select("*, doctors(profiles(full_name))")
          .eq("hospital_id", staffAssignment.hospital_id)
          .eq("appointment_date", today)
          .in("status", ["scheduled", "confirmed", "waiting"])
          .order("appointment_time", { ascending: true })
          .limit(5);

        setTodayAppointments((appointments as Appointment[]) || []);
      }
    } catch (error) {
      console.error("Error loading staff data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      loadStaffData();
    }
  }, [profile]);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  if (!assignment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Assignment Found</h3>
            <p className="text-gray-500">
              You haven&apos;t been assigned to any hospital yet. Please contact
              your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
        <p className="text-gray-500">
          {assignment.hospitals?.name ?? "Hospital"}
        </p>
        {assignment.hospitals?.address && (
          <p className="text-sm text-gray-400">
            {assignment.hospitals.address}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Tokens</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTokens}</div>
            <p className="text-xs text-gray-500">Currently in queue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waitingTokens}</div>
            <p className="text-xs text-gray-500">Waiting to be called</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Served Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.servedToday}</div>
            <p className="text-xs text-gray-500">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageWaitTime} min
            </div>
            <p className="text-xs text-gray-500">Average wait</p>
          </CardContent>
        </Card>
      </div>

      {/* My Assigned Queues */}
      <Card>
        <CardHeader>
          <CardTitle>My Assigned Queues</CardTitle>
        </CardHeader>
        <CardContent>
          {queues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No queues assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queues.map((queue) => (
                <Card
                  key={queue.id}
                  className="border-2 hover:border-blue-300 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{queue.name}</h3>
                      <Badge
                        variant={queue.is_active ? "default" : "secondary"}
                      >
                        {queue.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {queue.description && (
                      <p className="text-sm text-gray-500 mb-3">
                        {queue.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-3 text-sm">
                      <span className="text-gray-600">Current Token:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {queue.current_token_number}
                      </span>
                    </div>

                    <Link href={`/staff/queue/${queue.id}`}>
                      <Button className="w-full" size="sm">
                        Manage Queue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today&apos;s Appointments</CardTitle>
          <Link href="/staff/appointments">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded font-medium text-sm">
                        {apt.appointment_time.substring(0, 5)}
                      </div>
                      <div>
                        <p className="font-medium">{apt.patient_name}</p>
                        <p className="text-sm text-gray-500">
                          Dr. {apt.doctors?.profiles?.full_name ?? "Not assigned"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      apt.status === "confirmed" ? "default" : "secondary"
                    }
                  >
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/staff/patients/register">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-2"
              >
                <Users className="h-6 w-6" />
                <span className="text-sm">Register Patient</span>
              </Button>
            </Link>
            <Link href="/staff/appointments">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-2"
              >
                <Calendar className="h-6 w-6" />
                <span className="text-sm">Appointments</span>
              </Button>
            </Link>
            {queues[0] && (
              <Link href={`/staff/queue/${queues[0].id}`}>
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col gap-2"
                >
                  <Clock className="h-6 w-6" />
                  <span className="text-sm">Manage Queue</span>
                </Button>
              </Link>
            )}
            <Link href="/staff/settings">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-2"
              >
                <Users className="h-6 w-6" />
                <span className="text-sm">Settings</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
