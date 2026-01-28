import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Appointment, Business, Queue } from "@/lib/types";
import { useAuth } from "@/lib/hooks/use-auth";

const supabase = createClient();

interface AdminDashboardStats {
    totalDoctors: number;
    totalStaff: number;
    totalQueues: number;
    todayAppointments: number;
    todayTokens: number;
    activeTokens: number;
}

interface AdminDashboardData {
    business: Business | null;
    stats: AdminDashboardStats;
    activeQueues: Queue[];
    recentAppointments: Appointment[];
}

export function useAdminData() {
    const { profile } = useAuth();
    const today = new Date().toISOString().split("T")[0];

    return useQuery<AdminDashboardData>({
        queryKey: ["admin-dashboard", profile?.id],
        queryFn: async () => {
            if (!profile?.id) throw new Error("No profile");

            const { data: businessData } = await supabase
                .from("businesses")
                .select("*")
                .eq("admin_id", profile.id)
                .single();

            if (!businessData) {
                return {
                    business: null,
                    stats: {
                        totalDoctors: 0,
                        totalStaff: 0,
                        totalQueues: 0,
                        todayAppointments: 0,
                        todayTokens: 0,
                        activeTokens: 0,
                    },
                    activeQueues: [],
                    recentAppointments: [],
                };
            }

            const [
                doctors,
                staff,
                queues,
                appointments,
                tokens,
                activeTokensData,
                activeQueuesData,
                recentAppts,
            ] = await Promise.all([
                supabase
                    .from("doctors")
                    .select("*", { count: "exact", head: true })
                    .eq("business_id", businessData.id),
                supabase
                    .from("staff_assignments")
                    .select("*", { count: "exact", head: true })
                    .eq("business_id", businessData.id),
                supabase
                    .from("queues")
                    .select("*", { count: "exact", head: true })
                    .eq("business_id", businessData.id),
                supabase
                    .from("appointments")
                    .select("*", { count: "exact", head: true })
                    .eq("business_id", businessData.id)
                    .eq("appointment_date", today),
                supabase
                    .from("queue_tokens")
                    .select("*", { count: "exact", head: true })
                    .eq("business_id", businessData.id)
                    .gte("created_at", today),
                supabase
                    .from("queue_tokens")
                    .select("*", { count: "exact", head: true })
                    .eq("business_id", businessData.id)
                    .in("status", ["waiting", "called", "serving"]),
                supabase
                    .from("queues")
                    .select("*, departments(name)")
                    .eq("business_id", businessData.id)
                    .eq("is_active", true)
                    .limit(5),
                supabase
                    .from("appointments")
                    .select("*, doctors(profiles(full_name))")
                    .eq("business_id", businessData.id)
                    .gte("appointment_date", today)
                    .order("appointment_date", { ascending: true })
                    .limit(5),
            ]);

            return {
                business: businessData as Business,
                stats: {
                    totalDoctors: doctors.count || 0,
                    totalStaff: staff.count || 0,
                    totalQueues: queues.count || 0,
                    todayAppointments: appointments.count || 0,
                    todayTokens: tokens.count || 0,
                    activeTokens: activeTokensData.count || 0,
                },
                activeQueues: (activeQueuesData.data as Queue[]) || [],
                recentAppointments: (recentAppts.data as Appointment[]) || [],
            };
        },
        enabled: !!profile?.id,
        staleTime: 60 * 1000, 
        refetchInterval: 30 * 1000, 
        retry: 2,
    });
}
