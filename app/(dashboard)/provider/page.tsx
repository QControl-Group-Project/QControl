"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useDoctorData } from "@/lib/hooks/use-doctor-data";
import { useDoctorNotifications } from "@/lib/hooks/useRoleNotifications";
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Appointment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DoctorDashboard() {
  const { profile } = useAuth();
  const { data, isLoading, refetch } = useDoctorData();
  const supabase = createClient();

  const doctorInfo = data?.doctorInfo;
  const providerLabel = "Provider";
  
  
  useDoctorNotifications(doctorInfo?.id);
  const stats = data?.stats || {
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedToday: 0,
    totalPatients: 0,
  };
  const todayAppointments = data?.todayAppointments || [];

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

    refetch(); 
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{providerLabel} Dashboard</h1>
        <p className="text-gray-500">
          {doctorInfo?.specializations?.name} at {doctorInfo?.businesses?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Bookings
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
              Total Customers
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
                          Notes: {apt.symptoms}
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
                No bookings scheduled for today
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
