"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { loginSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ inviteToken }: { inviteToken?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const signedInUser = authData.user ?? authData.session?.user;
      let user: User | null = signedInUser ?? null;

      if (!user) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          user = userData.user ?? null;
        } catch (err) {
          if ((err as Error)?.name !== "AbortError") {
            throw err;
          }
        }
      }

      toast.success("Logged in successfully");

      if (inviteToken) {
        router.replace(`/auth/callback?invite=${inviteToken}`);
        router.refresh();
        return;
      }

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = profile?.role ?? "customer";
        const redirectMap: Record<string, string> = {
          owner: "/owner",
          provider: "/provider",
          staff: "/staff",
          customer: "/customer",
        };
        router.replace(redirectMap[role] ?? "/customer");
        router.refresh();
        return;
      }

      router.replace("/customer");
      router.refresh();
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        toast.error("Sign in failed. Please try again.");
        console.error("Login error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          className="mt-2 h-11"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-2">
            {errors.email.message as string}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••"
          className="mt-2 h-11"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive mt-2">
            {errors.password.message as string}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full h-11 mt-8" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
