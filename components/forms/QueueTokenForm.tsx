"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queueTokenSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { z } from "zod";
import { QueueToken } from "@/lib/types";

type QueueTokenFormValues = z.infer<typeof queueTokenSchema>;

interface QueueTokenFormProps {
  queueId: string;
  hospitalId: string;
  onSuccess?: (token: QueueToken) => void;
}

export function QueueTokenForm({
  queueId,
  hospitalId,
  onSuccess,
}: QueueTokenFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QueueTokenFormValues>({
    resolver: zodResolver(queueTokenSchema),
    defaultValues: {
      queue_id: queueId,
    },
  });

  const onSubmit = async (data: QueueTokenFormValues) => {
    setLoading(true);
    try {
      const result = await apiClient.post<{ token: QueueToken }>(
        "/queue/generate-token",
        {
        ...data,
        hospital_id: hospitalId,
        }
      );
      toast.success("Token generated successfully!");
      reset();
      if (result?.token) {
        onSuccess?.(result.token);
      }
    } catch (error) {
      toast.error("Failed to generate token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="patient_name">Your Name *</Label>
        <Input
          id="patient_name"
          placeholder="John Doe"
          {...register("patient_name")}
        />
        {errors.patient_name && (
          <p className="text-sm text-red-500 mt-1">
            {errors.patient_name.message as string}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="patient_phone">Phone Number</Label>
        <Input
          id="patient_phone"
          type="tel"
          placeholder="+1234567890"
          {...register("patient_phone")}
        />
        {errors.patient_phone && (
          <p className="text-sm text-red-500 mt-1">
            {errors.patient_phone.message as string}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="patient_age">Age</Label>
        <Input
          id="patient_age"
          type="number"
          placeholder="30"
          {...register("patient_age", { valueAsNumber: true })}
        />
        {errors.patient_age && (
          <p className="text-sm text-red-500 mt-1">
            {errors.patient_age.message as string}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="purpose">Purpose of Visit</Label>
        <Textarea
          id="purpose"
          placeholder="Describe your reason for visit..."
          {...register("purpose")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Generating Token..." : "Generate Token"}
      </Button>
    </form>
  );
}
