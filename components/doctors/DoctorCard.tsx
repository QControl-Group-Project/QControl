"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Stethoscope, Award, DollarSign } from "lucide-react";
import { Doctor } from "@/lib/types";

interface DoctorCardProps {
  doctor: Doctor;
  onSelect?: (doctor: Doctor) => void;
  showActions?: boolean;
}

export function DoctorCard({ doctor, onSelect, showActions }: DoctorCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              Dr. {doctor.profiles?.full_name}
            </h3>
            {doctor.specializations && (
              <div className="flex items-center gap-2 mt-1">
                <Stethoscope className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {doctor.specializations.name}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 text-sm">
              {doctor.experience_years && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Award className="h-4 w-4" />
                  <span>{doctor.experience_years} years</span>
                </div>
              )}
              {doctor.consultation_fee && (
                <div className="flex items-center gap-1 text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span>${doctor.consultation_fee}</span>
                </div>
              )}
            </div>

            {doctor.bio && (
              <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                {doctor.bio}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3">
              <Badge variant={doctor.is_available ? "default" : "secondary"}>
                {doctor.is_available ? "Available" : "Unavailable"}
              </Badge>
              {doctor.license_number && (
                <span className="text-xs text-gray-500">
                  Lic: {doctor.license_number}
                </span>
              )}
            </div>

            {showActions && onSelect && (
              <Button
                onClick={() => onSelect(doctor)}
                className="mt-4 w-full"
                size="sm"
              >
                Select Doctor
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
