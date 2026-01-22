"use client";

import { Appointment } from "@/lib/types";
import { AppointmentCard } from "./AppointmentCard";
import { EmptyState } from "@/components/layouts/EmptyState";
import { Calendar } from "lucide-react";

interface AppointmentListProps {
  appointments: Appointment[];
  onUpdateStatus?: (id: string, status: string) => void;
  onCancel?: (id: string) => void;
  showActions?: boolean;
  emptyMessage?: string;
}

export function AppointmentList({
  appointments,
  onUpdateStatus,
  onCancel,
  showActions,
  emptyMessage = "No appointments found",
}: AppointmentListProps) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title={emptyMessage}
        description="There are no appointments to display at the moment."
      />
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onUpdateStatus={onUpdateStatus}
          onCancel={onCancel}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
