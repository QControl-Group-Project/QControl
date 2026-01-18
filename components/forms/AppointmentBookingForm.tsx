"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { format } from "date-fns";
import { z } from "zod";
import { Appointment, Doctor, Hospital } from "@/lib/types";

type AppointmentFormValues = z.infer<typeof appointmentSchema>;
type SlotOption = { time: string; displayTime: string };

export function AppointmentBookingForm() {
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<SlotOption[]>([]);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
  });

  useEffect(() => {
    loadHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospital) {
      loadDoctors();
    }
  }, [selectedHospital]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const loadHospitals = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("hospitals")
      .select("*")
      .eq("is_active", true);
    setHospitals((data as Hospital[]) || []);
  };

  const loadDoctors = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("doctors")
      .select("*, profiles(full_name), specializations(name)")
      .eq("hospital_id", selectedHospital)
      .eq("is_available", true);
    setDoctors((data as Doctor[]) || []);
  };

  const loadAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;

    setLoadingSlots(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const result = await apiClient.get<{
        slots: SlotOption[];
      }>(
        `/appointments/available-slots?doctorId=${selectedDoctor}&date=${dateStr}`
      );
      setAvailableSlots(result.slots || []);
    } catch (error) {
      toast.error("Failed to load available slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const onSubmit = async (data: AppointmentFormValues) => {
    setLoading(true);
    try {
      await apiClient.post("/appointments/book", data);
      toast.success("Appointment booked successfully!");
    } catch (error) {
      toast.error("Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Hospital Selection */}
      <div>
        <Label>Select Hospital *</Label>
        <select
          className="w-full p-2 border rounded-md"
          value={selectedHospital}
          onChange={(e) => {
            setSelectedHospital(e.target.value);
            setValue("hospital_id", e.target.value);
          }}
        >
          <option value="">Choose hospital...</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      {/* Doctor Selection */}
      {selectedHospital && (
        <div>
          <Label>Select Doctor *</Label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedDoctor}
            onChange={(e) => {
              setSelectedDoctor(e.target.value);
              setValue("doctor_id", e.target.value);
            }}
          >
            <option value="">Choose doctor...</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.profiles?.full_name ?? "Doctor"} -{" "}
                {d.specializations?.name ?? "Specialty"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Date Selection */}
      {selectedDoctor && (
        <div>
          <Label>Select Date *</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              setValue("appointment_date", format(date!, "yyyy-MM-dd"));
            }}
            disabled={(date) => date < new Date()}
            className="rounded-md border"
          />
        </div>
      )}

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <Label>Available Time Slots *</Label>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <Button
                  key={slot.time}
                  type="button"
                  variant={
                    watch("appointment_time") === slot.time
                      ? "default"
                      : "outline"
                  }
                  onClick={() => setValue("appointment_time", slot.time)}
                >
                  {slot.displayTime}
                </Button>
              ))}
              {availableSlots.length === 0 && (
                <p className="col-span-4 text-center text-gray-500 py-4">
                  No available slots for this date
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Patient Information */}
      {watch("appointment_time") && (
        <>
          <div>
            <Label htmlFor="patient_name">Your Name *</Label>
            <Input id="patient_name" {...register("patient_name")} />
            {errors.patient_name && (
              <p className="text-sm text-red-500 mt-1">
                {errors.patient_name.message as string}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="patient_phone">Phone Number *</Label>
            <Input
              id="patient_phone"
              type="tel"
              {...register("patient_phone")}
            />
            {errors.patient_phone && (
              <p className="text-sm text-red-500 mt-1">
                {errors.patient_phone.message as string}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="patient_email">Email</Label>
            <Input
              id="patient_email"
              type="email"
              {...register("patient_email")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patient_age">Age</Label>
              <Input
                id="patient_age"
                type="number"
                {...register("patient_age", { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="patient_gender">Gender</Label>
              <select
                id="patient_gender"
                className="w-full p-2 border rounded-md"
                {...register("patient_gender")}
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="symptoms">Symptoms / Reason for Visit</Label>
            <Textarea id="symptoms" {...register("symptoms")} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Booking..." : "Book Appointment"}
          </Button>
        </>
      )}
    </form>
  );
}
