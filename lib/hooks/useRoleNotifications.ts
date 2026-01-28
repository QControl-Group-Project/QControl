
"use client";

import { useEffect, useCallback } from "react";
import { useRealtimeContext } from "@/lib/providers/realtime-provider";
import { useAuth } from "@/lib/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";


export function usePatientNotifications() {
  const { user, profile } = useAuth();
  const { broadcast } = useRealtimeContext();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (!user || !profile) return;

    const appointmentChannel = supabase
      .channel(`patient_appointments_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `patient_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const appointment = payload.new as any;
          const oldAppointment = payload.old as any;

          if (payload.eventType === "INSERT") {
            toast({
              title: "✅ Appointment Booked Successfully!",
              description: `Your appointment is scheduled for ${appointment.appointment_date} at ${appointment.appointment_time}`,
            });

            broadcast("notification", {
              type: "success",
              title: "Appointment Booked",
              message: `Appointment scheduled for ${appointment.appointment_date}`,
              userId: user.id,
            });
          } else if (payload.eventType === "UPDATE") {
            if (oldAppointment?.approval_status !== appointment.approval_status) {
              if (appointment.approval_status === "approved") {
                toast({
                  title: "🎉 Appointment Approved!",
                  description: `Your appointment on ${appointment.appointment_date} has been approved by the provider.`,
                });

                broadcast("notification", {
                  type: "success",
                  title: "Appointment Approved",
                  message: `Your appointment has been confirmed`,
                  userId: user.id,
                });
              } else if (appointment.approval_status === "rejected") {
                toast({
                  title: "❌ Appointment Rejected",
                  description: appointment.rejection_reason || "Please book another slot",
                  variant: "destructive",
                });

                broadcast("notification", {
                  type: "error",
                  title: "Appointment Rejected",
                  message: appointment.rejection_reason || "Please try another time slot",
                  userId: user.id,
                });
              }
            }

            if (oldAppointment?.status !== appointment.status) {
              if (appointment.status === "in-progress") {
                toast({
                  title: "👨‍⚕️ Provider is Ready",
                  description: "Your appointment has started. Please proceed to the service area.",
                });
              } else if (appointment.status === "completed") {
                toast({
                  title: "✅ Appointment Completed",
                  description: "Thank you for your visit!",
                });
              }
            }
          }
        }
      )
      .subscribe();

    const tokenChannel = supabase
      .channel(`patient_tokens_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_tokens",
          filter: `patient_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const token = payload.new as any;
          const oldToken = payload.old as any;

          if (payload.eventType === "INSERT") {
            toast({
              title: "🎫 Queue Token Generated!",
              description: `Your token number is #${token.token_number}`,
            });

            broadcast("notification", {
              type: "success",
              title: "Token Generated",
              message: `Your queue token #${token.token_number} has been created`,
              userId: user.id,
            });
          } else if (payload.eventType === "UPDATE" && oldToken) {
            if (oldToken.status !== token.status) {
              if (token.status === "called") {
                toast({
                  title: "🔔 Your Token is Called!",
                  description: `Token #${token.token_number} - Please proceed to the counter`,
                  duration: 10000,
                });

                if ("Notification" in window && Notification.permission === "granted") {
                  new Notification("Your Token is Called!", {
                    body: `Token #${token.token_number} - Please proceed to the counter`,
                    icon: "/favicon.ico",
                    tag: "token-called",
                    requireInteraction: true,
                  });
                }

                broadcast("notification", {
                  type: "warning",
                  title: "Token Called",
                  message: `Token #${token.token_number} has been called`,
                  userId: user.id,
                });
              } else if (token.status === "serving") {
                toast({
                  title: "✅ Now Being Served",
                  description: "Your consultation has started",
                });
              } else if (token.status === "served") {
                toast({
                  title: "✅ Service Completed",
                  description: "Thank you for your patience!",
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentChannel);
      supabase.removeChannel(tokenChannel);
    };
  }, [user, profile, supabase, toast, broadcast]);
}
 
export function useDoctorNotifications(doctorId?: string) {
  const { user } = useAuth();
  const { broadcast } = useRealtimeContext();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (!user || !doctorId) return;

    const channel = supabase
      .channel(`doctor_appointments_${doctorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `doctor_id=eq.${doctorId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const appointment = payload.new as any;
          const oldAppointment = payload.old as any;

          if (payload.eventType === "INSERT") {
            toast({
              title: "📅 New Appointment Request",
              description: `${appointment.patient_name} requested an appointment for ${appointment.appointment_date}`,
            });

            broadcast("notification", {
              type: "info",
              title: "New Appointment Request",
              message: `${appointment.patient_name} - ${appointment.appointment_date}`,
              userId: user.id,
            });
          } else if (payload.eventType === "UPDATE" && oldAppointment) {
            if (oldAppointment.status !== appointment.status && appointment.status === "cancelled") {
              toast({
                title: "🚫 Appointment Cancelled",
                description: `${appointment.patient_name}'s appointment was cancelled`,
                variant: "destructive",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, doctorId, supabase, toast, broadcast]);
}

export function useStaffNotifications(businessId?: string) {
  const { user } = useAuth();
  const { broadcast } = useRealtimeContext();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (!user || !businessId) return;

    const tokenChannel = supabase
      .channel(`staff_tokens_${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "queue_tokens",
          filter: `business_id=eq.${businessId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const token = payload.new as any;

          toast({
            title: "🎫 New Token Generated",
            description: `Token #${token.token_number} - ${token.patient_name}`,
          });

          broadcast("notification", {
            type: "info",
            title: "New Token",
            message: `Token #${token.token_number} added to queue`,
            userId: user.id,
          });
        }
      )
      .subscribe();

    const appointmentChannel = supabase
      .channel(`staff_appointments_${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: `business_id=eq.${businessId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const appointment = payload.new as any;

          toast({
            title: "📅 New Appointment Booked",
            description: `${appointment.patient_name} - ${appointment.appointment_date}`,
          });

          broadcast("notification", {
            type: "info",
            title: "New Appointment",
            message: `${appointment.patient_name} booked an appointment`,
            userId: user.id,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tokenChannel);
      supabase.removeChannel(appointmentChannel);
    };
  }, [user, businessId, supabase, toast, broadcast]);
}

export function useAdminNotifications(businessId?: string) {
  const { user } = useAuth();
  const { broadcast } = useRealtimeContext();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (!user || !businessId) return;
    
    const doctorChannel = supabase
      .channel(`admin_doctors_${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "doctors",
          filter: `business_id=eq.${businessId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          toast({
            title: "👨‍⚕️ New Provider Added",
            description: "A new provider has joined your business",
          });

          broadcast("notification", {
            type: "success",
            title: "New Provider",
            message: "New provider registered",
            userId: user.id,
          });
        }
      )
      .subscribe();

    const appointmentChannel = supabase
      .channel(`admin_appointments_${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: `business_id=eq.${businessId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const appointment = payload.new as any;

          broadcast("notification", {
            type: "info",
            title: "New Appointment",
            message: `${appointment.patient_name} booked an appointment`,
            userId: user.id,
          });
        }
      )
      .subscribe();

    const queueChannel = supabase
      .channel(`admin_queues_${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "queue_tokens",
          filter: `business_id=eq.${businessId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const token = payload.new as any;

          broadcast("notification", {
            type: "info",
            title: "Queue Activity",
            message: `New token #${token.token_number} generated`,
            userId: user.id,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(doctorChannel);
      supabase.removeChannel(appointmentChannel);
      supabase.removeChannel(queueChannel);
    };
  }, [user, businessId, supabase, toast, broadcast]);
}

export function useRoleBasedNotifications(contextData?: {
  doctorId?: string;
  businessId?: string;
}) {
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile?.role) return;

  }, [profile?.role, contextData]);

  return {
    role: profile?.role,
  };
}

