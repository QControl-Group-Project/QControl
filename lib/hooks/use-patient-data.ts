import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Appointment, QueueToken } from "@/lib/types";
import { useAuth } from "@/lib/hooks/use-auth";

const supabase = createClient();

interface DashboardStats {
    totalAppointments: number;
    completedAppointments: number;
    upcomingAppointments: number;
    activeTokens: number;
}

interface PatientDashboardData {
    stats: DashboardStats;
    upcomingAppointments: Appointment[];
    activeTokens: QueueToken[];
}

export function usePatientData() {
    const { profile } = useAuth();
    const today = new Date().toISOString().split("T")[0];

    return useQuery<PatientDashboardData>({
        queryKey: ["patient-dashboard", profile?.id],
        queryFn: async () => {
            if (!profile?.id) throw new Error("No profile");

            const { data: appointments } = await supabase
                .from("appointments")
                .select(
                    "*, doctors(profiles(full_name), specializations(name)), businesses(name, address)"
                )
                .eq("patient_id", profile.id)
                .gte("appointment_date", today)
                .in("status", ["scheduled", "confirmed"])
                .order("appointment_date", { ascending: true })
                .order("appointment_time", { ascending: true })
                .limit(5);

            const { data: tokens } = await supabase
                .from("queue_tokens")
                .select(
                    "*, queues(name, estimated_wait_time), businesses(name, address)"
                )
                .eq("patient_id", profile.id)
                .in("status", ["waiting", "called", "serving"])
                .order("created_at", { ascending: false });

            const [totalAppts, completedAppts, upcomingAppts, activeTokensCount] =
                await Promise.all([
                    supabase
                        .from("appointments")
                        .select("*", { count: "exact", head: true })
                        .eq("patient_id", profile.id),
                    supabase
                        .from("appointments")
                        .select("*", { count: "exact", head: true })
                        .eq("patient_id", profile.id)
                        .eq("status", "completed"),
                    supabase
                        .from("appointments")
                        .select("*", { count: "exact", head: true })
                        .eq("patient_id", profile.id)
                        .gte("appointment_date", today)
                        .in("status", ["scheduled", "confirmed"]),
                    supabase
                        .from("queue_tokens")
                        .select("*", { count: "exact", head: true })
                        .eq("patient_id", profile.id)
                        .in("status", ["waiting", "called", "serving"]),
                ]);

            return {
                upcomingAppointments: (appointments as Appointment[]) || [],
                activeTokens: (tokens as QueueToken[]) || [],
                stats: {
                    totalAppointments: totalAppts.count || 0,
                    completedAppointments: completedAppts.count || 0,
                    upcomingAppointments: upcomingAppts.count || 0,
                    activeTokens: activeTokensCount.count || 0,
                },
            };
        },
        enabled: !!profile?.id,
        staleTime: 5 * 60 * 1000, 
    });
}
