"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Appointment } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

export function useAppointments(filters?: {
  doctorId?: string;
  patientId?: string;
  businessId?: string;
  date?: string;
  status?: string;
}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  const loadAppointments = async () => {
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

    query = query
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Error loading appointments:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } else {
      setAppointments((data as Appointment[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAppointments();

    const channel = supabase
      .channel("appointments_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        () => {
          loadAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters]);

  const updateStatus = async (appointmentId: string, status: string) => {
    const updateData: Partial<Appointment> & {
      status: Appointment["status"];
    } = { status: status as Appointment["status"] };

    if (status === "confirmed") {
      updateData.confirmed_at = new Date().toISOString();
    } else if (status === "in-progress") {
      updateData.started_at = new Date().toISOString();
    } else if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    } else if (status === "cancelled") {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });
      loadAppointments();
    }
  };

  return {
    appointments,
    loading,
    updateStatus,
    reload: loadAppointments,
  };
}
