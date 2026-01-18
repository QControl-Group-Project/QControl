"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, Calendar } from "lucide-react";
import { calculateAge } from "@/lib/utils";
import { Profile } from "@/lib/types";

interface PatientCardProps {
  patient: Profile;
  onClick?: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  return (
    <Card
      className={
        onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      }
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-gray-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{patient.full_name}</h3>
            <div className="space-y-1 mt-2 text-sm text-gray-600">
              {patient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.date_of_birth && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>{calculateAge(patient.date_of_birth)} years old</span>
                </div>
              )}
            </div>
            {patient.gender && (
              <Badge variant="secondary" className="mt-2">
                {patient.gender}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
