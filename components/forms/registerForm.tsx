"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type RegisterFormValues = z.input<typeof registerSchema>;

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "patient",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          phone: data.phone,
          role: data.role || "patient",
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
      <div>
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          placeholder="John Doe"
          {...register("full_name")}
        />
        {errors.full_name && (
          <p className="text-sm text-red-500 mt-1">
            {errors.full_name.message as string}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">
            {errors.email.message as string}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1234567890"
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-sm text-red-500 mt-1">
            {errors.phone.message as string}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="role">Account Type</Label>
        <select
          id="role"
          className="w-full p-2 border rounded-md"
          {...register("role")}
        >
          <option value="patient">Patient</option>
          <option value="admin">Hospital</option>
        </select>
        {errors.role && (
          <p className="text-sm text-red-500 mt-1">
            {errors.role.message as string}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">
            {errors.password.message as string}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
