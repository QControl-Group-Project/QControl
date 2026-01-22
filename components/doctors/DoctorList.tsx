"use client";

import { DoctorCard } from "./DoctorCard";
import { EmptyState } from "@/components/layouts/EmptyState";
import { Stethoscope } from "lucide-react";
import { Doctor } from "@/lib/types";

interface DoctorListProps {
  doctors: Doctor[];
  onSelectDoctor?: (doctor: Doctor) => void;
  showActions?: boolean;
}

export function DoctorList({
  doctors,
  onSelectDoctor,
  showActions,
}: DoctorListProps) {
  if (doctors.length === 0) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="No doctors found"
        description="There are no doctors available at the moment"
      />
    );
  }

  return (
    <div className="space-y-4">
      {doctors.map((doctor) => (
        <DoctorCard
          key={doctor.id}
          doctor={doctor}
          onSelect={onSelectDoctor}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
