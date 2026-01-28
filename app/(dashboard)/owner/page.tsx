"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { useRealtimeDashboardData } from "@/lib/hooks/use-realtime-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Clock, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const { data, isLoading } = useAdminData();

  const business = data?.business;

  useRealtimeDashboardData(business?.id);
  const stats = data?.stats || {
    totalDoctors: 0, 
    totalStaff: 0,
    totalQueues: 0,
    todayAppointments: 0,
    todayTokens: 0,
    activeTokens: 0,
  };   
  const activeQueues = data?.activeQueues || [];
  const recentAppointments = data?.recentAppointments || [];

  if (authLoading || isLoading) {
    return (
      <div className="p-6 space-y-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[350px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    )
  }


  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Business Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDoctors}</div>
            <p className="text-xs text-muted-foreground">Active service providers</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">Support staff</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Active Tokens</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTokens}</div>
            <p className="text-xs text-muted-foreground">In queue now</p>
          </CardContent>
        </Card>
      </div>

      <DashboardChart />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
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
                      Provider: {apt.doctors?.profiles?.full_name ?? "Not assigned"}
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
            {activeQueues.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No active queues found</p>
              </div>
            ) : (
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}