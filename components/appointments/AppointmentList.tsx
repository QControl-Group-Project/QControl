"use client";

import { Appointment } from "@/lib/types";
import { AppointmentCard } from "./AppointmentCard";
import { EmptyState } from "@/components/layouts/EmptyState";
import { Calendar } from "lucide-react";

interface AppointmentListProps {
  appointments: Appointment[];
  onUpdateStatus?: (id: string, status: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  emptyMessage?: string;
  layout?: "list" | "grid";
  cardVariant?: "default" | "customer";
}

export function AppointmentList({
  appointments,
  onUpdateStatus,
  onCancel,
  onDelete,
  showActions,
  emptyMessage = "No bookings found",
  layout = "list",
  cardVariant = "default",
}: AppointmentListProps) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title={emptyMessage}
        description="There are no bookings to display at the moment."
      />
    );
  }

  return (
    <div
      className={
        layout === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          : "space-y-4"
      }
    >
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onUpdateStatus={onUpdateStatus}
          onCancel={onCancel}
          onDelete={onDelete}
          showActions={showActions}
          variant={cardVariant}
        />
      ))}
    </div>
  );
}
