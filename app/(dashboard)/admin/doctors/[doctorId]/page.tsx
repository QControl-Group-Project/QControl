"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layouts/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/layouts/EmptyState";
import { Doctor, DoctorSchedule } from "@/lib/types";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";

export default function DoctorDetailsPage({
  params,
}: {
  params: { doctorId: string };
}) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const supabase = createClient();
  const router = useRouter();

  const loadDoctor = async () => {
    const { data } = await supabase
      .from("doctors")
      .select("*, profiles(full_name, email), departments(name), specializations(name)")
      .eq("id", params.doctorId)
      .single();

    setDoctor((data as Doctor) || null);
  };

  const loadSchedules = async () => {
    const { data } = await supabase
      .from("doctor_schedules")
      .select("*")
      .eq("doctor_id", params.doctorId)
      .order("day_of_week");
    setSchedules((data as DoctorSchedule[]) || []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDoctor();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSchedules();
  }, [params.doctorId]);

  const toggleAvailability = async () => {
    if (!doctor) return;
    const { error } = await supabase
      .from("doctors")
      .update({ is_available: !doctor.is_available })
      .eq("id", doctor.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Availability updated");
    loadDoctor();
  };

  const deleteDoctor = async () => {
    if (!doctor) return;
    const { error } = await supabase.from("doctors").delete().eq("id", doctor.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Doctor removed");
    router.push("/admin/doctors");
  };

  if (!doctor) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Stethoscope}
          title="Doctor not found"
          description="The doctor record could not be loaded."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={doctor.profiles?.full_name ?? "Doctor"}
        description={doctor.specializations?.name ?? "Doctor profile"}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Doctor Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">
              Email: {doctor.profiles?.email ?? "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              Department: {doctor.departments?.name ?? "Not assigned"}
            </p>
            <p className="text-sm text-gray-600">
              License: {doctor.license_number ?? "Not provided"}
            </p>
            <p className="text-sm text-gray-600">
              Experience: {doctor.experience_years ?? 0} years
            </p>
            <p className="text-sm text-gray-600">
              Fee: {doctor.consultation_fee ?? 0}
            </p>
            <Badge variant={doctor.is_available ? "default" : "secondary"}>
              {doctor.is_available ? "Available" : "Unavailable"}
            </Badge>
            <div className="flex gap-2 pt-2">
              <Button onClick={toggleAvailability} variant="outline">
                Toggle Availability
              </Button>
              <Button onClick={deleteDoctor} variant="destructive">
                Remove Doctor
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <p className="text-sm text-gray-500">
                No schedule configured yet.
              </p>
            ) : (
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between border rounded-md p-2 text-sm"
                  >
                    <span>Day {schedule.day_of_week}</span>
                    <span>
                      {schedule.start_time.substring(0, 5)} -{" "}
                      {schedule.end_time.substring(0, 5)}
                    </span>
                    <span>{schedule.slot_duration} min</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

