"use client";

import { Appointment } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAppointmentStatusColor, formatDate, formatTime } from "@/lib/utils";
import { Calendar, Clock, User, MapPin, FileText } from "lucide-react";

interface AppointmentCardProps {
  appointment: Appointment;
  onUpdateStatus?: (id: string, status: string) => void;
  onCancel?: (id: string) => void;
  showActions?: boolean;
}

export function AppointmentCard({
  appointment,
  onUpdateStatus,
  onCancel,
  showActions = false,
}: AppointmentCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-semibold">
              #{appointment.appointment_number}
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
              <span>Dr. {appointment.doctors.profiles?.full_name}</span>
            </div>
          )}
          {appointment.hospitals && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{appointment.hospitals.name}</span>
            </div>
          )}
        </div>

        {appointment.symptoms && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-700 mb-1">Symptoms:</p>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
