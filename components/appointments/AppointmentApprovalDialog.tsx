"use client";

import { useState } from "react";
import { Appointment } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import { Calendar, Clock, User, FileText } from "lucide-react";

interface AppointmentApprovalDialogProps {
  appointment: Appointment | null;
  action: "approve" | "reject" | "cancel" | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (appointmentId: string, action: string, reason?: string) => void;
  loading?: boolean;
}

export function AppointmentApprovalDialog({
  appointment,
  action,
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: AppointmentApprovalDialogProps) {
  const [reason, setReason] = useState("");

  if (!appointment || !action) return null;

  const handleConfirm = () => {
    onConfirm(appointment.id, action, reason);
    setReason("");
  };

  const handleCancel = () => {
    setReason("");
    onOpenChange(false);
  };

  const titles: Record<string, string> = {
    approve: "Approve Booking",
    reject: "Reject Booking",
    cancel: "Cancel Booking",
  };

  const descriptions: Record<string, string> = {
    approve: "Are you sure you want to approve this booking? The customer will be notified.",
    reject: "Please provide a reason for rejecting this booking. The customer will be notified.",
    cancel: "Please provide a reason for cancelling this booking. The customer will be notified.",
  };

  const buttonLabels: Record<string, string> = {
    approve: "Approve",
    reject: "Reject",
    cancel: "Cancel Booking",
  };

  const buttonVariants: Record<string, "default" | "destructive"> = {
    approve: "default",
    reject: "destructive",
    cancel: "destructive",
  };

  const requiresReason = action === "reject" || action === "cancel";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{titles[action]}</AlertDialogTitle>
          <AlertDialogDescription>{descriptions[action]}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{appointment.patient_name}</span>
            </div>
            <Badge variant="outline">{appointment.appointment_type}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(appointment.appointment_date, "PPP")}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatTime(appointment.appointment_time)}</span>
            </div>
          </div>

          {appointment.symptoms && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground">Notes:</p>
                <p>{appointment.symptoms}</p>
              </div>
            </div>
          )}
        </div>

        {requiresReason && (
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder={
                action === "reject"
                  ? "e.g., Schedule conflict, Customer needs different time..."
                  : "e.g., Provider unavailable, Urgent closure..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {action === "approve" && (
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes for the customer..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading || (requiresReason && !reason.trim())}
            className={buttonVariants[action] === "destructive" ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {loading ? "Processing..." : buttonLabels[action]}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

