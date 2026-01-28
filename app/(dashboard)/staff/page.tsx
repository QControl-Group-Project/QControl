"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useStaffData } from "@/lib/hooks/use-staff-data";
import { useStaffNotifications } from "@/lib/hooks/useRoleNotifications";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Appointment, Queue, QueueToken, StaffAssignment } from "@/lib/types";

export default function StaffDashboard() {
  const { profile } = useAuth();
  const { data, isLoading } = useStaffData();

  const assignments = data?.assignment;
  const queues = data?.queues || [];
  
  
  useStaffNotifications(assignments?.business_id);
  const stats = data?.stats || {
    activeTokens: 0,
    servedToday: 0,
    waitingTokens: 0,
    averageWaitTime: 0,
  };
  const todayAppointments = data?.todayAppointments || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>

        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (!assignments) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Assignment Found</h3>
            <p className="text-gray-500">
              You haven&apos;t been assigned to any business yet. Please contact
              your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      <div>
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
        <p className="text-gray-500">
          {assignments.businesses?.name ?? "Business"}
        </p>
        {assignments.businesses?.address && (
          <p className="text-sm text-gray-400">
            {assignments.businesses.address}
          </p>
        )}
      </div>

      
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
