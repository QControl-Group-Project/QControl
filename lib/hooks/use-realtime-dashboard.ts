"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { useAdminNotifications } from "./useRoleNotifications";

export function useRealtimeDashboardData(businessId?: string) {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const supabase = createClient();

    useAdminNotifications(businessId);

    useEffect(() => {
        if (!businessId || !profile?.id) return;

        const appointmentsChannel = supabase
            .channel(`dashboard_appointments_${businessId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "appointments",
                    filter: `business_id=eq.${businessId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["admin-dashboard", profile.id] });
                    queryClient.invalidateQueries({ queryKey: ["dashboard-chart", profile.id] });
                }
            )
            .subscribe();

        const tokensChannel = supabase
            .channel(`dashboard_tokens_${businessId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "queue_tokens",
                    filter: `business_id=eq.${businessId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["admin-dashboard", profile.id] });
                    queryClient.invalidateQueries({ queryKey: ["dashboard-chart", profile.id] });
                }
            )
            .subscribe();

        const queuesChannel = supabase
            .channel(`dashboard_queues_${businessId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "queues",
                    filter: `business_id=eq.${businessId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["admin-dashboard", profile.id] });
                }
            )
            .subscribe();

        const doctorsChannel = supabase
            .channel(`dashboard_doctors_${businessId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "doctors",
                    filter: `business_id=eq.${businessId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["admin-dashboard", profile.id] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(appointmentsChannel);
            supabase.removeChannel(tokensChannel);
            supabase.removeChannel(queuesChannel);
            supabase.removeChannel(doctorsChannel);
        };
    }, [businessId, profile?.id, queryClient, supabase]);
}