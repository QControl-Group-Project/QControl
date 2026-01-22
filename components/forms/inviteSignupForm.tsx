"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type RegisterFormValues = z.input<typeof registerSchema>;

type InviteSignupFormProps = {
  token: string;
  email: string;
  role: "doctor" | "staff";
};

export function InviteSignupForm({ token, email, role }: InviteSignupFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email,
      role,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone,
            role,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const userId = authData.user?.id;
      const response = await fetch("/api/invitations/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          user_id: userId,
          email: data.email,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result?.error || "Failed to complete invitation");
        return;
      }

      toast.success("Invitation accepted. Please sign in.");
      router.replace("/login");
    } catch (err) {
      toast.error("Failed to accept invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} readOnly />
      </div>

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
        {loading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}

