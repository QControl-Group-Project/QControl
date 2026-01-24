"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();

  useEffect(() => {
    const waitForSession = async () => {
      const code = searchParams.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        return session;
      }

      return await new Promise<typeof session>((resolve) => {
        const { data: subscription } = supabase.auth.onAuthStateChange(
          (_event, newSession) => {
            if (newSession?.user) {
              subscription.subscription.unsubscribe();
              resolve(newSession);
            }
          }
        );

        setTimeout(() => {
          subscription.subscription.unsubscribe();
          resolve(null);
        }, 5000);
      });
    };

    const handleCallback = async () => {
      const session = await waitForSession();

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      const inviteToken = searchParams.get("invite");
      let role = "patient";

      if (inviteToken) {
        try {
          const response = await fetch("/api/invitations/accept", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: inviteToken }),
          });
          const data = await response.json();
          if (response.ok && data?.role) {
            role = data.role;
            router.replace(`/${role}`);
            return;
          }
        } catch (error) {
          console.error("Failed to accept invitation:", error);
        }

        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      role = profile?.role ?? role;
      router.replace(`/${role}`);
    };

    handleCallback();
  }, [router, searchParams, supabase]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">Signing you in...</div>
    </div>
  );
}

