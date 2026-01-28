"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/layouts/EmptyState";
import { Users } from "lucide-react";
import { Appointment, Doctor } from "@/lib/types";

type PatientSummary = {
  id: string;
  name: string;
  phone?: string;
  age?: number;
  gender?: string;
  lastVisit?: string;
};

export default function DoctorPatientsPage() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const supabase = createClient();

  const loadPatients = async () => {
    if (!profile) return;

    const { data: doctor } = await supabase
      .from("doctors")
      .select("id")
      .eq("profile_id", profile.id)
      .single();

    if (!doctor) {
      setAppointments([]);
      return;
    }

    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("doctor_id", (doctor as Doctor).id)
      .order("appointment_date", { ascending: false });

    setAppointments((data as Appointment[]) || []);
  };

  useEffect(() => {
    if (profile) {
      loadPatients();
    }
  }, [profile]);

  const patients = useMemo(() => {
    const map = new Map<string, PatientSummary>();
    for (const apt of appointments) {
      const key = apt.patient_id ?? `${apt.patient_name}-${apt.patient_phone}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: apt.patient_name,
          phone: apt.patient_phone,
          age: apt.patient_age,
          gender: apt.patient_gender,
          lastVisit: apt.appointment_date,
        });
      }
    }
    return Array.from(map.values());
  }, [appointments]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Customers" description="View your assigned customers" />
      {patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Customers will appear here once appointments are booked."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map((patient) => (
            <Card key={patient.id}>
              <CardContent className="p-4 space-y-1">
                <p className="font-semibold">{patient.name}</p>
                <p className="text-sm text-gray-600">
                  {patient.age ? `${patient.age} years` : "Age not provided"} •{" "}
                  {patient.gender ?? "Gender not set"}
                </p>
                {patient.phone && (
                  <p className="text-sm text-gray-500">{patient.phone}</p>
                )}
                {patient.lastVisit && (
                  <p className="text-xs text-gray-400">
                    Last visit: {patient.lastVisit}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

