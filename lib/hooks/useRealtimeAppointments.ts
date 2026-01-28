"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Appointment, AppointmentStatus, ApprovalStatus } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  REALTIME_CHANNEL_STATES,
} from "@supabase/supabase-js";

export interface AppointmentFilters {
  doctorId?: string;
  patientId?: string;
  businessId?: string;
  date?: string;
  status?: AppointmentStatus;
  approvalStatus?: ApprovalStatus;
}

export type AppointmentChangeEvent = "INSERT" | "UPDATE" | "DELETE";

export interface AppointmentChangePayload {
  event: AppointmentChangeEvent;
  appointment: Appointment;
  oldAppointment?: Appointment;
}

interface UseRealtimeAppointmentsOptions {
  filters?: AppointmentFilters;
  onAppointmentChange?: (payload: AppointmentChangePayload) => void;
  onNewAppointment?: (appointment: Appointment) => void;
  onAppointmentApproved?: (appointment: Appointment) => void;
  onAppointmentRejected?: (appointment: Appointment, reason?: string) => void;
  onAppointmentCancelled?: (appointment: Appointment, reason?: string) => void;
}

export interface RealtimeAppointmentsState {
  appointments: Appointment[];
  pendingApprovals: Appointment[];
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

export interface RealtimeAppointmentsActions {
  approveAppointment: (appointmentId: string, notes?: string) => Promise<void>;
  rejectAppointment: (appointmentId: string, reason: string) => Promise<void>;
  cancelAppointment: (appointmentId: string, reason: string) => Promise<void>;
  confirmAppointment: (appointmentId: string) => Promise<void>;
  startAppointment: (appointmentId: string) => Promise<void>;
  completeAppointment: (appointmentId: string, diagnosis?: string, prescription?: string) => Promise<void>;
  markNoShow: (appointmentId: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useRealtimeAppointments(
  options: UseRealtimeAppointmentsOptions = {}
): RealtimeAppointmentsState & RealtimeAppointmentsActions {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const supabase = createClient();
  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);
  type RealtimeChannelState =
    (typeof REALTIME_CHANNEL_STATES)[keyof typeof REALTIME_CHANNEL_STATES];

  const {
    filters,
    onAppointmentChange,
    onNewAppointment,
    onAppointmentApproved,
    onAppointmentRejected,
    onAppointmentCancelled,
  } = options;

  const today = new Date().toISOString().split("T")[0];
  
  const pendingApprovals = appointments.filter(
    a => a.approval_status === "pending" && a.status !== "cancelled"
  );
  
  const todayAppointments = appointments.filter(
    a => a.appointment_date === today
  );
  
  const upcomingAppointments = appointments.filter(
    a => a.appointment_date > today && a.status !== "cancelled" && a.status !== "rejected"
  );

  const loadAppointments = useCallback(async () => {
    let query = supabase
      .from("appointments")
      .select(
        "*, doctors(profiles(full_name), specializations(name)), businesses(name)"
      );

    if (filters?.doctorId) {
      query = query.eq("doctor_id", filters.doctorId);
    }
    if (filters?.patientId) {
      query = query.eq("patient_id", filters.patientId);
    }
    if (filters?.businessId) {
      query = query.eq("business_id", filters.businessId);
    }
    if (filters?.date) {
      query = query.eq("appointment_date", filters.date);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.approvalStatus) {
      query = query.eq("approval_status", filters.approvalStatus);
    }

    query = query
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    const { data, error: queryError } = await query;

    if (queryError) {
      console.error("Error loading appointments:", queryError);
      setError("Failed to load appointments");
    } else {
      setAppointments((data as Appointment[]) || []);
      setError(null);
    }
    setLoading(false);
  }, [supabase, filters]);

  const reload = useCallback(async () => {
    setLoading(true);
    await loadAppointments();
  }, [loadAppointments]);

  const handleAppointmentChange = useCallback((
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => {
    const event = payload.eventType as AppointmentChangeEvent;
    const newAppointment = payload.new as unknown as Appointment;
    const oldAppointment = payload.old as unknown as Appointment;

    const matchesFilters = () => {
      if (!filters) return true;
      if (filters.doctorId && newAppointment?.doctor_id !== filters.doctorId) return false;
      if (filters.patientId && newAppointment?.patient_id !== filters.patientId) return false;
      if (filters.businessId && newAppointment?.business_id !== filters.businessId) return false;
      return true;
    };

    if (!matchesFilters()) return;

    if (event === "INSERT") {
      loadAppointments();
      onNewAppointment?.(newAppointment);
    } else if (event === "UPDATE") {
      setAppointments(prev => prev.map(a => a.id === newAppointment.id ? { ...a, ...newAppointment } : a));
      
      if (oldAppointment?.approval_status !== newAppointment.approval_status) {
        if (newAppointment.approval_status === "approved") {
          onAppointmentApproved?.(newAppointment);
        } else if (newAppointment.approval_status === "rejected") {
          onAppointmentRejected?.(newAppointment, newAppointment.rejection_reason);
        }
      }
      
      if (oldAppointment?.status !== "cancelled" && newAppointment.status === "cancelled") {
        onAppointmentCancelled?.(newAppointment, newAppointment.cancellation_reason);
      }
    } else if (event === "DELETE") {
      setAppointments(prev => prev.filter(a => a.id !== oldAppointment.id));
    }

    onAppointmentChange?.({ event, appointment: newAppointment || oldAppointment, oldAppointment });
  }, [filters, loadAppointments, onAppointmentChange, onNewAppointment, onAppointmentApproved, onAppointmentRejected, onAppointmentCancelled]);

  useEffect(() => {
    loadAppointments();

    let filterStr = "";
    if (filters?.doctorId) {
      filterStr = `doctor_id=eq.${filters.doctorId}`;
    } else if (filters?.businessId) {
      filterStr = `business_id=eq.${filters.businessId}`;
    } else if (filters?.patientId) {
      filterStr = `patient_id=eq.${filters.patientId}`;
    }

    const channelConfig: Parameters<typeof supabase.channel>[1] = {};
    
    channelRef.current = supabase
      .channel("appointments_realtime", channelConfig)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          ...(filterStr ? { filter: filterStr } : {}),
        },
        handleAppointmentChange
      )
      .subscribe((status: RealtimeChannelState) => {
        setIsConnected(status === REALTIME_CHANNEL_STATES.joined);
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase, filters, loadAppointments, handleAppointmentChange]);

  const approveAppointment = useCallback(async (appointmentId: string, notes?: string) => {
    const updateData: Partial<Appointment> = {
      approval_status: "approved",
      status: "confirmed",
      approved_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
    };
    if (notes) {
      updateData.notes = notes;
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to approve appointment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Approved",
        description: "Appointment has been approved and confirmed",
      });
    }
  }, [supabase, toast]);

  const rejectAppointment = useCallback(async (appointmentId: string, reason: string) => {
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        approval_status: "rejected",
        status: "rejected",
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to reject appointment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Rejected",
        description: "Appointment has been rejected",
      });
    }
  }, [supabase, toast]);

  const cancelAppointment = useCallback(async (appointmentId: string, reason: string) => {
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cancelled",
        description: "Appointment has been cancelled",
      });
    }
  }, [supabase, toast]);

  const confirmAppointment = useCallback(async (appointmentId: string) => {
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to confirm appointment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Confirmed",
        description: "Appointment has been confirmed",
      });
    }
  }, [supabase, toast]);

  const startAppointment = useCallback(async (appointmentId: string) => {
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "in-progress",
        started_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to start appointment",
        variant: "destructive",
      });
    }
  }, [supabase, toast]);

  const completeAppointment = useCallback(async (
    appointmentId: string, 
    diagnosis?: string, 
    prescription?: string
  ) => {
    const updateData: Partial<Appointment> = {
      status: "completed",
      completed_at: new Date().toISOString(),
    };
    if (diagnosis) updateData.diagnosis = diagnosis;
    if (prescription) updateData.prescription = prescription;

    const { error: updateError } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to complete appointment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Completed",
        description: "Appointment has been completed",
      });
    }
  }, [supabase, toast]);

  const markNoShow = useCallback(async (appointmentId: string) => {
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "no-show" })
      .eq("id", appointmentId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to mark as no-show",
        variant: "destructive",
      });
    } else {
      toast({
        title: "No Show",
        description: "Patient marked as no-show",
      });
    }
  }, [supabase, toast]);

  return {
    appointments,
    pendingApprovals,
    todayAppointments,
    upcomingAppointments,
    loading,
    error,
    isConnected,
    approveAppointment,
    rejectAppointment,
    cancelAppointment,
    confirmAppointment,
    startAppointment,
    completeAppointment,
    markNoShow,
    reload,
  };
}

