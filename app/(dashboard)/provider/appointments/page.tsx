"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRealtimeAppointments } from "@/lib/hooks/useRealtimeAppointments";
import { PageHeader } from "@/components/layouts/PageHeader";
import { DoctorAppointmentCard } from "@/components/appointments/DoctorAppointmentCard";
import { AppointmentApprovalDialog } from "@/components/appointments/AppointmentApprovalDialog";
import { EmptyState } from "@/components/layouts/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Appointment, Doctor } from "@/lib/types";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function DoctorAppointmentsPage() {
  const { profile } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | "cancel" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const supabase = createClient();
  const { toast } = useToast();

  
  useEffect(() => {
    const loadDoctor = async () => {
      if (!profile) return;

      const { data: doctorData } = await supabase
        .from("doctors")
        .select("*")
        .eq("profile_id", profile.id)
        .single();

      setDoctor((doctorData as Doctor) || null);
    };

    if (profile) {
      loadDoctor();
    }
  }, [profile, supabase]);

  
  const {
    appointments,
    pendingApprovals,
    todayAppointments,
    upcomingAppointments,
    loading,
    isConnected,
    approveAppointment,
    rejectAppointment,
    cancelAppointment,
    startAppointment,
    completeAppointment,
    markNoShow,
    reload,
  } = useRealtimeAppointments({
    filters: doctor ? { doctorId: doctor.id } : undefined,
    onNewAppointment: (appointment) => {
      toast({
        title: "New Booking Request",
        description: `${appointment.patient_name} has requested a booking`,
      });
    },
    onAppointmentApproved: (appointment) => {
      toast({
        title: "Booking Approved",
        description: `Booking with ${appointment.patient_name} has been approved`,
      });
    },
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const pastAppointments = appointments.filter(
    (a) => a.appointment_date < today
  );

  const handleApprove = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogAction("approve");
    setDialogOpen(true);
  };

  const handleReject = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogAction("reject");
    setDialogOpen(true);
  };

  const handleCancel = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogAction("cancel");
    setDialogOpen(true);
  };

  const handleDialogConfirm = async (appointmentId: string, action: string, reason?: string) => {
    setActionLoading(true);
    try {
      switch (action) {
        case "approve":
          await approveAppointment(appointmentId, reason);
          break;
        case "reject":
          if (reason) await rejectAppointment(appointmentId, reason);
          break;
        case "cancel":
          if (reason) await cancelAppointment(appointmentId, reason);
          break;
      }
      setDialogOpen(false);
      setSelectedAppointment(null);
      setDialogAction(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async (id: string) => {
    await startAppointment(id);
  };

  const handleComplete = async (id: string) => {
    await completeAppointment(id);
  };

  const handleNoShow = async (id: string) => {
    await markNoShow(id);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="My Bookings"
        description="Manage your bookings in real-time"
        action={
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Wifi className="h-3 w-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <WifiOff className="h-3 w-3 mr-1" />
                Connecting...
              </Badge>
            )}
          </div>
        }
      />

      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingApprovals.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayAppointments.length}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {appointments.filter(a => a.status === "completed").length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      
      <Tabs defaultValue={pendingApprovals.length > 0 ? "pending" : "today"}>
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending Approval
            {pendingApprovals.length > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingApprovals.length}
              </span>
            )}
          </TabsTrigger>
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

        <TabsContent value="pending" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 h-32" />
                </Card>
              ))}
            </div>
          ) : pendingApprovals.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No pending approvals"
              description="All booking requests have been reviewed."
            />
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((appointment) => (
                <DoctorAppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  showApprovalActions
                  showStatusActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="today" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 h-32" />
                </Card>
              ))}
            </div>
          ) : todayAppointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No bookings today"
              description="You don't have any bookings scheduled for today."
            />
          ) : (
            <div className="space-y-4">
              {todayAppointments
                .filter(a => a.approval_status !== "pending")
                .map((appointment) => (
                  <DoctorAppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onStart={handleStart}
                    onComplete={handleComplete}
                    onNoShow={handleNoShow}
                    onCancel={handleCancel}
                    showApprovalActions={false}
                    showStatusActions
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 h-32" />
                </Card>
              ))}
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming bookings"
              description="You don't have any upcoming bookings."
            />
          ) : (
            <div className="space-y-4">
              {upcomingAppointments
                .filter(a => a.approval_status !== "pending")
                .map((appointment) => (
                  <DoctorAppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onCancel={handleCancel}
                    showApprovalActions={false}
                    showStatusActions
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 h-32" />
                </Card>
              ))}
            </div>
          ) : pastAppointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No past bookings"
              description="You don't have any past bookings."
            />
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((appointment) => (
                <DoctorAppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  showApprovalActions={false}
                  showStatusActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      
      <AppointmentApprovalDialog
        appointment={selectedAppointment}
        action={dialogAction}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleDialogConfirm}
        loading={actionLoading}
      />
    </div>
  );
}
