"use client";

import { Appointment } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAppointmentStatusColor, formatDate, formatTime } from "@/lib/utils";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  Hash,
  Stethoscope,
  Trash2,
} from "lucide-react";

interface AppointmentCardProps {
  appointment: Appointment;
  onUpdateStatus?: (id: string, status: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  variant?: "default" | "customer";
}

export function AppointmentCard({
  appointment,
  onUpdateStatus,
  onCancel,
  onDelete,
  showActions = false,
  variant = "default",
}: AppointmentCardProps) {
  if (variant === "customer") {
    return (
      <Card className="overflow-hidden border-muted/60 bg-card/95 shadow-sm transition-all hover:shadow-md">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Booking
              </p>
              <div className="flex items-center gap-2">
                <Badge className={getAppointmentStatusColor(appointment.status)}>
                  {appointment.status}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  #{appointment.appointment_number}
                </span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {appointment.patient_name}
              </p>
              {(appointment.patient_age || appointment.patient_gender) && (
                <p className="text-xs text-muted-foreground">
                  {appointment.patient_age ? `${appointment.patient_age} years` : ""}
                  {appointment.patient_age && appointment.patient_gender ? " • " : ""}
                  {appointment.patient_gender ?? ""}
                </p>
              )}
            </div>
            <div className="text-right text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-end gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(appointment.appointment_date, "PPP")}</span>
              </div>
              <div className="flex items-center justify-end gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTime(appointment.appointment_time)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-2 text-sm">
            {appointment.doctors && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Stethoscope className="h-4 w-4" />
                <span className="text-foreground">
                  {appointment.doctors.profiles?.full_name ?? "Provider"}
                </span>
              </div>
            )}
            {appointment.businesses && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{appointment.businesses.name}</span>
              </div>
            )}
            {appointment.appointment_type && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="capitalize">{appointment.appointment_type}</span>
              </div>
            )}
          </div>

          {appointment.symptoms && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Notes</p>
              <p>{appointment.symptoms}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-semibold">
            </div>
            <div>
              <p className="font-semibold text-lg">
                {appointment.patient_name}
              </p>
              <p className="text-sm text-gray-500">
                {appointment.patient_age} years • {appointment.patient_gender}
              </p>
            </div>
          </div>
          <Badge className={getAppointmentStatusColor(appointment.status)}>
            {appointment.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{formatDate(appointment.appointment_date, "PPP")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{formatTime(appointment.appointment_time)}</span>
          </div>
          {appointment.doctors && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <span>Provider: {appointment.doctors.profiles?.full_name}</span>
            </div>
          )}
          {appointment.businesses && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{appointment.businesses.name}</span>
            </div>
          )}
        </div>

        {appointment.symptoms && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-700 mb-1">Notes:</p>
                <p className="text-gray-600">{appointment.symptoms}</p>
              </div>
            </div>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2">
            {appointment.status === "scheduled" && onUpdateStatus && (
              <Button
                onClick={() => onUpdateStatus(appointment.id, "confirmed")}
                size="sm"
              >
                Confirm
              </Button>
            )}
            {appointment.status === "confirmed" && onUpdateStatus && (
              <Button
                onClick={() => onUpdateStatus(appointment.id, "in-progress")}
                size="sm"
              >
                Start
              </Button>
            )}
            {appointment.status === "in-progress" && onUpdateStatus && (
              <Button
                onClick={() => onUpdateStatus(appointment.id, "completed")}
                size="sm"
              >
                Complete
              </Button>
            )}
            {["scheduled", "confirmed"].includes(appointment.status) &&
              onCancel && (
                <Button
                  onClick={() => onCancel(appointment.id)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              )}
            {onDelete && (
              <Button
                onClick={() => onDelete(appointment.id)}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
