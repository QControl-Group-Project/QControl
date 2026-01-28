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
  CheckCircle, 
  XCircle, 
  Play, 
  CheckCheck,
  AlertCircle,
  Phone,
  Mail
} from "lucide-react";

interface DoctorAppointmentCardProps {
  appointment: Appointment;
  onApprove?: (appointment: Appointment) => void;
  onReject?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onNoShow?: (id: string) => void;
  showApprovalActions?: boolean;
  showStatusActions?: boolean;
}

export function DoctorAppointmentCard({
  appointment,
  onApprove,
  onReject,
  onCancel,
  onStart,
  onComplete,
  onNoShow,
  showApprovalActions = true,
  showStatusActions = true,
}: DoctorAppointmentCardProps) {
  const isPending = appointment.approval_status === "pending";
  const isRejected = appointment.status === "rejected" || appointment.approval_status === "rejected";
  const isCancelled = appointment.status === "cancelled";

  const getApprovalBadge = () => {
    if (appointment.approval_status === "pending") {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Approval</Badge>;
    }
    if (appointment.approval_status === "approved") {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
    }
    if (appointment.approval_status === "rejected") {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
    }
    return null;
  };

  return (
    <Card className={`transition-all ${isPending ? "border-yellow-200 bg-yellow-50/30" : ""} ${isRejected ? "opacity-60" : ""}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-semibold">
              #{appointment.appointment_number}
            </div>
            <div>
              <p className="font-semibold text-lg">{appointment.patient_name}</p>
              <p className="text-sm text-muted-foreground">
                {appointment.patient_age} years • {appointment.patient_gender}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getAppointmentStatusColor(appointment.status)}>
              {appointment.status}
            </Badge>
            {getApprovalBadge()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(appointment.appointment_date, "PPP")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatTime(appointment.appointment_time)}</span>
          </div>
          {appointment.patient_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.patient_phone}</span>
            </div>
          )}
          {appointment.patient_email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{appointment.patient_email}</span>
            </div>
          )}
          {appointment.businesses && (
            <div className="flex items-center gap-2 text-sm col-span-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.businesses.name}</span>
            </div>
          )}
        </div>

        {appointment.symptoms && (
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-muted-foreground mb-1">Notes:</p>
                <p>{appointment.symptoms}</p>
              </div>
            </div>
          </div>
        )}

        {(appointment.rejection_reason || appointment.cancellation_reason) && (
          <div className="bg-red-50 rounded-lg p-3 mb-4 border border-red-100">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-700 mb-1">
                  {appointment.rejection_reason ? "Rejection Reason:" : "Cancellation Reason:"}
                </p>
                <p className="text-red-600">
                  {appointment.rejection_reason || appointment.cancellation_reason}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {showApprovalActions && isPending && (
            <>
              {onApprove && (
                <Button
                  onClick={() => onApprove(appointment)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              )}
              {onReject && (
                <Button
                  onClick={() => onReject(appointment)}
                  size="sm"
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              )}
            </>
          )}

          {showStatusActions && !isPending && !isRejected && !isCancelled && (
            <>
              {appointment.status === "confirmed" && onStart && (
                <Button onClick={() => onStart(appointment.id)} size="sm">
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </Button>
              )}
              {appointment.status === "in-progress" && onComplete && (
                <Button onClick={() => onComplete(appointment.id)} size="sm">
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              )}
              {["confirmed", "scheduled"].includes(appointment.status) && onNoShow && (
                <Button onClick={() => onNoShow(appointment.id)} size="sm" variant="outline">
                  <User className="h-4 w-4 mr-1" />
                  No-show
                </Button>
              )}
              {["scheduled", "confirmed"].includes(appointment.status) && onCancel && (
                <Button
                  onClick={() => onCancel(appointment)}
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

