"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format } from "date-fns";
import { Doctor, Business } from "@/lib/types";

export default function BookAppointmentPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [symptoms, setSymptoms] = useState("");
  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      loadDoctors();
    }
  }, [selectedBusiness]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const loadBusinesses = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("is_active", true);
    setBusinesses((data as Business[]) || []);
  };

  const loadDoctors = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("doctors")
      .select("*, profiles(full_name), specializations(name)")
      .eq("business_id", selectedBusiness)
      .eq("is_available", true);
    setDoctors((data as Doctor[]) || []);
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;
    const supabase = createClient();

    const dayOfWeek = selectedDate.getDay();
    const { data: schedules } = await supabase
      .from("doctor_schedules")
      .select("*")
      .eq("doctor_id", selectedDoctor)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    if (!schedules || schedules.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const slots = [];
    for (const schedule of schedules) {
      const [startHour, startMin] = schedule.start_time.split(":").map(Number);
      const [endHour, endMin] = schedule.end_time.split(":").map(Number);

      let currentTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      while (currentTime < endTime) {
        const hour = Math.floor(currentTime / 60);
        const min = currentTime % 60;
        const timeStr = `${hour.toString().padStart(2, "0")}:${min
          .toString()
          .padStart(2, "0")}:00`;

        const { data: isAvailable } = await supabase.rpc(
          "check_doctor_availability",
          {
            p_doctor_id: selectedDoctor,
            p_appointment_date: format(selectedDate, "yyyy-MM-dd"),
            p_appointment_time: timeStr,
          }
        );

        if (isAvailable) {
          slots.push(timeStr);
        }

        currentTime += schedule.slot_duration;
      }
    }
    setAvailableSlots(slots);
  };

  const bookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const supabase = createClient();
      const { data: appointmentNumber } = await supabase.rpc(
        "get_next_appointment_number",
        {
          p_doctor_id: selectedDoctor,
          p_appointment_date: format(selectedDate!, "yyyy-MM-dd"),
        }
      );

      const { error } = await supabase.from("appointments").insert({
          business_id: selectedBusiness,
        doctor_id: selectedDoctor,
        appointment_number: appointmentNumber,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_email: patientEmail,
        appointment_date: format(selectedDate!, "yyyy-MM-dd"),
        appointment_time: selectedSlot,
        symptoms: symptoms,
        status: "scheduled",
      });

      if (error) throw error;

      toast.success("Booking confirmed!");
    } catch (error) {
      toast.error("Failed to book");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Book a Service</h1>
        <form onSubmit={bookAppointment} className="space-y-6">
          <div>
            <Label>Select Business</Label>
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Choose business...</option>
              {businesses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {selectedBusiness && (
            <div>
              <Label>Select Provider</Label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Choose provider...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.profiles?.full_name ?? "Provider"} -{" "}
                    {d.specializations?.name ?? "Specialty"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedDoctor && (
            <div>
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
              />
            </div>
          )}

          {availableSlots.length > 0 && (
            <div>
              <Label>Available Time Slots</Label>
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    type="button"
                    variant={selectedSlot === slot ? "default" : "outline"}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot.substring(0, 5)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {selectedSlot && (
            <>
              <div>
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="symptoms">Reason / Notes</Label>
                <textarea
                  id="symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full p-2 border rounded min-h-[100px]"
                />
              </div>
              <Button type="submit" className="w-full">
                Book Service
              </Button>
            </>
          )}
        </form>
      </Card>
    </div>
  );
}
