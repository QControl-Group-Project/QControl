"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doctorScheduleSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { DoctorSchedule } from "@/lib/types";
import { z } from "zod";

type ScheduleFormValues = z.infer<typeof doctorScheduleSchema>;

interface DoctorScheduleEditorProps {
  doctorId: string;
  existingSchedules?: DoctorSchedule[];
}

export function DoctorScheduleEditor({
  doctorId,
  existingSchedules = [],
}: DoctorScheduleEditorProps) {
  const [schedules, setSchedules] =
    useState<DoctorSchedule[]>(existingSchedules);
  const [isAdding, setIsAdding] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(doctorScheduleSchema),
    defaultValues: {
      doctor_id: doctorId,
    },
  });

  const onSubmit = async (data: ScheduleFormValues) => {
    const { error } = await supabase.from("doctor_schedules").insert(data);

    if (error) {
      toast.error("Failed to add schedule");
    } else {
      toast.success("Schedule added successfully");
      setIsAdding(false);
      reset();
      // Reload schedules
      loadSchedules();
    }
  };

  const loadSchedules = async () => {
    const { data } = await supabase
      .from("doctor_schedules")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("day_of_week");
    setSchedules((data as DoctorSchedule[]) || []);
  };

  const deleteSchedule = async (id: string) => {
    const { error } = await supabase
      .from("doctor_schedules")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete schedule");
    } else {
      toast.success("Schedule deleted");
      loadSchedules();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Schedule</CardTitle>
          <Button onClick={() => setIsAdding(!isAdding)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Schedule Form */}
        {isAdding && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="border rounded-lg p-4 space-y-3"
          >
            <div>
              <Label>Day of Week</Label>
              <select
                className="w-full p-2 border rounded-md"
                {...register("day_of_week", { valueAsNumber: true })}
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input type="time" {...register("start_time")} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" {...register("end_time")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Slot Duration (minutes)</Label>
                <Input
                  type="number"
                  {...register("slot_duration", { valueAsNumber: true })}
                  defaultValue={15}
                />
              </div>
              <div>
                <Label>Max Patients per Slot</Label>
                <Input
                  type="number"
                  {...register("max_patients_per_slot", {
                    valueAsNumber: true,
                  })}
                  defaultValue={1}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Existing Schedules */}
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Badge>{DAYS_OF_WEEK[schedule.day_of_week]}</Badge>
                <span className="text-sm">
                  {schedule.start_time.substring(0, 5)} -{" "}
                  {schedule.end_time.substring(0, 5)}
                </span>
                <span className="text-xs text-gray-500">
                  {schedule.slot_duration}min slots
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteSchedule(schedule.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          {schedules.length === 0 && !isAdding && (
            <p className="text-center text-gray-500 py-4">
              No schedules configured
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
