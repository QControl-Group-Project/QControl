"use client";

import { useEffect, useState, useCallback } from "react";
import { REALTIME_CHANNEL_STATES } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Appointment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Wifi, 
  WifiOff, 
  MapPin, 
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  Stethoscope
} from "lucide-react";
import { formatDate, formatTime, getAppointmentStatusColor } from "@/lib/utils";

interface AppointmentTrackerRealtimeProps {
  appointmentId: string;
  onStatusChange?: (status: string, appointment: Appointment) => void;
}

export function AppointmentTrackerRealtime({ 
  appointmentId,
  onStatusChange 
}: AppointmentTrackerRealtimeProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  const supabase = createClient();
  type RealtimeChannelState =
    (typeof REALTIME_CHANNEL_STATES)[keyof typeof REALTIME_CHANNEL_STATES];

  const loadAppointment = useCallback(async () => {
    if (!appointmentId) return;

    const { data, error } = await supabase
      .from("appointments")
      .select("*, doctors(profiles(full_name), specializations(name)), businesses(name)")
      .eq("id", appointmentId)
      .single();

    if (error) {
      console.error("Error loading appointment:", error);
      setLoading(false);
      return;
    }

    setAppointment(data as Appointment);
    setLoading(false);
  }, [appointmentId, supabase]);

  const enableNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
      }
    }
  };

  const announceStatusChange = useCallback((newStatus: string, appt: Appointment) => {
    if (Notification.permission !== "granted") return;

    const messages: Record<string, string> = {
      confirmed: `Your appointment with Dr. ${appt.doctors?.profiles?.full_name} has been confirmed!`,
      rejected: `Your appointment request was not approved. Reason: ${appt.rejection_reason || "Not specified"}`,
      cancelled: `Your appointment has been cancelled. Reason: ${appt.cancellation_reason || "Not specified"}`,
      "in-progress": "Your appointment has started. The doctor is seeing you now.",
      completed: "Your appointment is complete. Thank you for your visit!",
    };

    if (messages[newStatus]) {
      new Notification("Booking Update", {
        body: messages[newStatus],
        icon: "/favicon.ico",
      });
    }
  }, []);

  useEffect(() => {
    if (!appointmentId) return;

    loadAppointment();

    const channel = supabase
      .channel(`appointment_tracker_${appointmentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `id=eq.${appointmentId}`,
        },
        (payload: any) => {
          const newAppointment = payload.new as Appointment;
          setAppointment(prev => prev ? { ...prev, ...newAppointment } : newAppointment);
          
          if (previousStatus && newAppointment.status !== previousStatus) {
            onStatusChange?.(newAppointment.status, newAppointment);
            
            if (notificationsEnabled) {
              announceStatusChange(newAppointment.status, newAppointment);
            }
          }
          setPreviousStatus(newAppointment.status);
        }
      )
      .subscribe((status: RealtimeChannelState) => {
        setIsConnected(status === REALTIME_CHANNEL_STATES.joined);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId, supabase, previousStatus, notificationsEnabled, loadAppointment, announceStatusChange, onStatusChange]);

  useEffect(() => {
    if (appointment && !previousStatus) {
      setPreviousStatus(appointment.status);
    }
  }, [appointment, previousStatus]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-8 h-64" />
      </Card>
    );
  }

  if (!appointment) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Booking Not Found</p>
          <p className="text-muted-foreground">
            This booking does not exist or has been removed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (appointment.status) {
      case "pending":
        return <Clock className="h-8 w-8" />;
      case "confirmed":
        return <CheckCircle className="h-8 w-8" />;
      case "in-progress":
        return <Stethoscope className="h-8 w-8" />;
      case "completed":
        return <CheckCircle className="h-8 w-8" />;
      case "cancelled":
      case "rejected":
        return <XCircle className="h-8 w-8" />;
      default:
        return <Clock className="h-8 w-8" />;
    }
  };

  const getStatusMessage = () => {
    switch (appointment.status) {
      case "pending":
        return "Waiting for provider approval";
      case "scheduled":
        return "Booking is scheduled";
      case "confirmed":
        return "Your booking is confirmed!";
      case "waiting":
        return "Please check in at the reception";
      case "in-progress":
        return "You are currently with the provider";
      case "completed":
        return "Booking completed. Thank you!";
      case "cancelled":
        return "This booking was cancelled";
      case "rejected":
        return "Booking request was not approved";
      case "no-show":
        return "Marked as no-show";
      default:
        return "";
    }
  };

  const isNegativeStatus = ["cancelled", "rejected", "no-show"].includes(appointment.status);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {isConnected ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Wifi className="h-3 w-3 mr-1" />
            Live Updates
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <WifiOff className="h-3 w-3 mr-1" />
            Connecting...
          </Badge>
        )}
      </div>

      <Card className={`overflow-hidden ${
        appointment.status === "confirmed" 
          ? "border-green-500 border-2" 
          : appointment.status === "in-progress"
            ? "border-blue-500 border-2"
            : isNegativeStatus
              ? "border-red-300"
              : ""
      }`}>
        <CardHeader className={`text-center pb-2 ${
          appointment.status === "confirmed"
            ? "bg-green-600 text-white"
            : appointment.status === "in-progress"
              ? "bg-blue-600 text-white"
              : isNegativeStatus
                ? "bg-red-100"
                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        }`}>
          <CardTitle className="text-lg">Booking Status</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className={getAppointmentStatusColor(appointment.status) + " p-3 rounded-full"}>
                {getStatusIcon()}
              </div>
            </div>
            
            <Badge className={getAppointmentStatusColor(appointment.status) + " text-lg px-4 py-2"}>
              {appointment.status.toUpperCase()}
            </Badge>

            <p className="text-xl font-medium mt-4 mb-2">
              {getStatusMessage()}
            </p>

            {appointment.approval_status === "pending" && (
              <p className="text-muted-foreground">
                The doctor will review your request soon
              </p>
            )}

            {(appointment.rejection_reason || appointment.cancellation_reason) && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-700">
                  {appointment.rejection_reason ? "Reason for rejection:" : "Reason for cancellation:"}
                </p>
                <p className="text-red-600 mt-1">
                  {appointment.rejection_reason || appointment.cancellation_reason}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appointment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(appointment.appointment_date, "PPP")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{formatTime(appointment.appointment_time)}</p>
              </div>
            </div>
          </div>

          {appointment.doctors && (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Doctor</p>
                <p className="font-medium">
                  Dr. {appointment.doctors.profiles?.full_name}
                  {appointment.doctors.specializations && (
                    <span className="text-muted-foreground ml-1">
                      ({appointment.doctors.specializations.name})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {appointment.businesses && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Business</p>
                <p className="font-medium">{appointment.businesses.name}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Stethoscope className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{appointment.appointment_type}</p>
            </div>
          </div>

          {appointment.symptoms && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-1">Symptoms</p>
              <p>{appointment.symptoms}</p>
            </div>
          )}

          {appointment.diagnosis && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-1">Diagnosis</p>
              <p>{appointment.diagnosis}</p>
            </div>
          )}

          {appointment.prescription && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-1">Prescription</p>
              <p>{appointment.prescription}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Get Notified</p>
                <p className="text-sm text-muted-foreground">
                  Receive alerts when your appointment status changes
                </p>
              </div>
            </div>
            <Button
              variant={notificationsEnabled ? "default" : "outline"}
              onClick={enableNotifications}
              disabled={notificationsEnabled}
            >
              {notificationsEnabled ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Enabled
                </>
              ) : (
                "Enable"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

