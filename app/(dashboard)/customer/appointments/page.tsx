"use client";

import { useAppointments } from "@/lib/hooks/useAppointments";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { AppointmentList } from "@/components/appointments/AppointmentList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Appointment } from "@/lib/types";

export default function PatientAppointmentsPage() {
  const { profile } = useAuth();
  const { appointments, loading } = useAppointments({ patientId: profile?.id });

  const upcoming = appointments.filter((a: Appointment) =>
    ["scheduled", "confirmed"].includes(a.status)
  );
  const completed = appointments.filter(
    (a: Appointment) => a.status === "completed"
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="My Bookings"
        description="View and manage your bookings"
        action={
          <Link href="/appointments">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Book New
            </Button>
          </Link>
        }
      />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completed.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({appointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          <AppointmentList
            appointments={upcoming}
            emptyMessage="No upcoming bookings"
            layout="grid"
            cardVariant="customer"
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <AppointmentList
            appointments={completed}
            emptyMessage="No completed bookings"
            layout="grid"
            cardVariant="customer"
          />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <AppointmentList
            appointments={appointments}
            emptyMessage="No bookings found"
            layout="grid"
            cardVariant="customer"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
