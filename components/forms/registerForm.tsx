"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { registerSchema } from "@/lib/validation";
import { BUSINESS_TYPE_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type RegisterFormValues = z.input<typeof registerSchema>;

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "customer",
    },
  });

  const role = watch("role");
  const businessType = watch("business_type");

  useEffect(() => {
    if (role === "owner" && !businessType) {
      setValue("business_type", "business");
    }
  }, [role, businessType, setValue]);

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          phone: data.phone,
          role: data.role || "customer",
          business_type: data.role === "owner" ? data.business_type : null,
          business_type_custom:
            data.role === "owner" ? data.business_type_custom : null,
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created successfully!");
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
          <Input
            id="full_name"
            placeholder="John Doe"
            className="mt-1 h-10"
            {...register("full_name")}
          />
          {errors.full_name && (
            <p className="text-xs text-destructive mt-1">
              {errors.full_name.message as string}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="mt-1 h-10"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">
              {errors.email.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1234567890"
            className="mt-1 h-10"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-destructive mt-1">
              {errors.phone.message as string}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="•••••••"
            className="mt-1 h-10"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive mt-1">
              {errors.password.message as string}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="role" className="text-sm font-medium">Account Type</Label>
        <Select
          onValueChange={(value) => setValue("role", value ?? undefined)}
          defaultValue={role ?? undefined}
        >
          <SelectTrigger className="mt-1 h-10">
            <SelectValue>
              {(value) => {
                if (!value) return "Select account type";
                return value === "owner" ? "Business Owner" : "Customer";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="owner">Business Owner</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-xs text-destructive mt-1">
            {errors.role.message as string}
          </p>
        )}
      </div>

      {role === "owner" && (
        <div className="rounded-md border bg-muted/30 p-3 space-y-3">
          <div>
            <Label htmlFor="business_type" className="text-sm font-medium">Business Type</Label>
            <Select
              onValueChange={(value) =>
                setValue("business_type", value ?? undefined)
              }
              defaultValue={businessType ?? undefined}
            >
            <SelectTrigger className="mt-1 h-10">
              <SelectValue>
                {(value) => {
                  if (!value) return "Select business type";
                  return value === "custom"
                    ? "Custom"
                    : value.charAt(0).toUpperCase() + value.slice(1);
                }}
              </SelectValue>
            </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "custom"
                      ? "Custom"
                      : option.charAt(0).toUpperCase() + option.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.business_type && (
              <p className="text-xs text-destructive mt-1">
                {errors.business_type.message as string}
              </p>
            )}
          </div>

          {businessType === "custom" && (
            <div>
              <Label htmlFor="business_type_custom" className="text-sm font-medium">Custom Business Type</Label>
              <Input
                id="business_type_custom"
                placeholder="e.g., Pet Grooming"
                className="mt-1 h-10"
                {...register("business_type_custom")}
              />
              {errors.business_type_custom && (
                <p className="text-xs text-destructive mt-1">
                  {errors.business_type_custom.message as string}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <Button type="submit" className="w-full h-10" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
