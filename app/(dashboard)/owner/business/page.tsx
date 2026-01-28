"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { businessSchema } from "@/lib/validation";
import { BUSINESS_TYPE_OPTIONS } from "@/lib/constants";
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
import { Business } from "@/lib/types";

type BusinessFormValues = z.infer<typeof businessSchema>;

export default function BusinessSettingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
  });
  const businessType = watch("business_type");

  const loadBusiness = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("admin_id", profile.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Failed to load business:", error);
      toast.error("Failed to load business settings");
    }

    if (data) {
      setBusiness(data as Business);
      reset(data as BusinessFormValues);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile) {
      loadBusiness();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [profile, authLoading]);

  const onSubmit = async (data: BusinessFormValues) => {
    if (!profile) return;

    setSaving(true);
    try {
      if (business) {

        const { error } = await supabase
          .from("businesses")
          .update(data)
          .eq("id", business.id);

        if (error) throw error;
        toast.success("Business updated successfully");
      } else {

        const { error } = await supabase.from("businesses").insert({
          ...data,
          admin_id: profile.id,
          is_active: true,
        });

        if (error) throw error;
        toast.success("Business created successfully");
      }
      loadBusiness();
    } catch (error) {
      console.error("Failed to save business:", error);
      toast.error("Failed to save business");
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) return <LoadingSpinner />;

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">
          You need to be logged in to manage business settings.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Business Settings"
        description="Manage your business information"
      />

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.name.message as string}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="business_type">Business Type *</Label>
                <select
                  id="business_type"
                  className="w-full p-2 border rounded-md"
                  {...register("business_type")}
                >
                  {BUSINESS_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === "custom"
                        ? "Custom"
                        : option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.business_type && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.business_type.message as string}
                  </p>
                )}
              </div>

              {businessType === "custom" && (
                <div className="col-span-2">
                  <Label htmlFor="business_type_custom">
                    Custom Business Type *
                  </Label>
                  <Input
                    id="business_type_custom"
                    {...register("business_type_custom")}
                  />
                  {errors.business_type_custom && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.business_type_custom.message as string}
                    </p>
                  )}
                </div>
              )}

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
                : business
                  ? "Update Business"
                  : "Create Business"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
