"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Appointment } from "@/lib/types";
import { format, isSameDay, parseISO } from "date-fns";

interface AppointmentCalendarProps {
  appointments: Appointment[];
}

export function AppointmentCalendar({
  appointments,
}: AppointmentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const appointmentsOnDate = appointments.filter((apt) =>
    isSameDay(parseISO(apt.appointment_date), selectedDate)
  );

  const getDayAppointmentCount = (date: Date) => {
    return appointments.filter((apt) =>
      isSameDay(parseISO(apt.appointment_date), date)
    ).length;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
            modifiers={{
              hasAppointments: (date) => getDayAppointmentCount(date) > 0,
            }}
            modifiersStyles={{
              hasAppointments: {
                fontWeight: "bold",
                textDecoration: "underline",
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointments on {format(selectedDate, "PPP")}</CardTitle>
        </CardHeader>
        <CardContent>
          {appointmentsOnDate.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No bookings on this date
            </p>
          ) : (
            <div className="space-y-3">
              {appointmentsOnDate.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{apt.patient_name}</p>
                    <p className="text-sm text-gray-500">
                      {apt.appointment_time.substring(0, 5)}
                    </p>
                  </div>
                  <Badge>{apt.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
