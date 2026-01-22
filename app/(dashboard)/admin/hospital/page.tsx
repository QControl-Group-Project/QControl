"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { hospitalSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layouts/PageHeader";
import { LoadingSpinner } from "@/components/layouts/loadingSpinner";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Hospital } from "@/lib/types";

type HospitalFormValues = z.infer<typeof hospitalSchema>;

export default function HospitalSettingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HospitalFormValues>({
    resolver: zodResolver(hospitalSchema),
  });

  const loadHospital = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("hospitals")
      .select("*")
      .eq("admin_id", profile.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Failed to load hospital:", error);
      toast.error("Failed to load hospital settings");
    }

    if (data) {
      setHospital(data as Hospital);
      reset(data as HospitalFormValues);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile) {
      loadHospital();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [profile, authLoading]);

  const onSubmit = async (data: HospitalFormValues) => {
    if (!profile) return;

    setSaving(true);
    try {
      if (hospital) {

        const { error } = await supabase
          .from("hospitals")
          .update(data)
          .eq("id", hospital.id);

        if (error) throw error;
        toast.success("Hospital updated successfully");
      } else {

        const { error } = await supabase.from("hospitals").insert({
          ...data,
          admin_id: profile.id,
          is_active: true,
        });

        if (error) throw error;
        toast.success("Hospital created successfully");
      }
      loadHospital();
    } catch (error) {
      console.error("Failed to save hospital:", error);
      toast.error("Failed to save hospital");
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) return <LoadingSpinner />;

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">
          You need to be logged in to manage hospital settings.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Hospital Settings"
        description="Manage your hospital information"
      />

      <Card>
        <CardHeader>
          <CardTitle>Hospital Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Hospital Name *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.name.message as string}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register("description")} />
              </div>

              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" {...register("state")} />
              </div>

              <div>
                <Label htmlFor="zip_code">Zip Code</Label>
                <Input id="zip_code" {...register("zip_code")} />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" {...register("phone")} />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="url" {...register("website")} />
              </div>

              <div>
                <Label htmlFor="opening_time">Opening Time</Label>
                <Input
                  id="opening_time"
                  type="time"
                  {...register("opening_time")}
                />
              </div>

              <div>
                <Label htmlFor="closing_time">Closing Time</Label>
                <Input
                  id="closing_time"
                  type="time"
                  {...register("closing_time")}
                />
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving
                ? "Saving..."
                : hospital
                  ? "Update Hospital"
                  : "Create Hospital"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
