import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Appointment, Queue, QueueToken, StaffAssignment } from "@/lib/types";
import { useAuth } from "@/lib/hooks/use-auth";

const supabase = createClient();

interface StaffDashboardStats {
    activeTokens: number;
    servedToday: number;
    waitingTokens: number;
    averageWaitTime: number;
}

interface StaffDashboardData {
    assignment: StaffAssignment | null;
    queues: Queue[];
    stats: StaffDashboardStats;
    todayAppointments: Appointment[];
}

export function useStaffData() {
    const { profile } = useAuth();
    const today = new Date().toISOString().split("T")[0];

    return useQuery<StaffDashboardData>({
        queryKey: ["staff-dashboard", profile?.id],
        queryFn: async () => {
            if (!profile?.id) throw new Error("No profile");

            const { data: staffAssignment } = await supabase
                .from("staff_assignments")
                .select("*, businesses(name, address)")
                .eq("staff_id", profile.id)
                .eq("is_active", true)
                .single();

            if (!staffAssignment) {
                return {
                    assignment: null,
                    queues: [],
                    stats: {
                        activeTokens: 0,
                        servedToday: 0,
                        waitingTokens: 0,
                        averageWaitTime: 0
                    },
                    todayAppointments: []
                };
            }

            const { data: queueAssignments } = await supabase
                .from("queue_staff_assignments")
                .select("*, queues(*)")
                .eq("staff_id", profile.id)
                .eq("is_active", true);

            const queuesData =
                (queueAssignments as { queues: Queue }[] | null)?.map(
                    (qa) => qa.queues
                ) || [];

            let stats = {
                activeTokens: 0,
                servedToday: 0,
                waitingTokens: 0,
                averageWaitTime: 0,
            };

            const queueIds = queuesData.map((q) => q.id);

            if (queueIds.length > 0) {
                const { data: tokens } = await supabase
                    .from("queue_tokens")
                    .select("*")
                    .in("queue_id", queueIds)
                    .gte("created_at", today);

                const typedTokens = (tokens as QueueToken[]) || [];
                const activeTokens = typedTokens.filter((t) =>
                    ["waiting", "called", "serving"].includes(t.status)
                ).length;

                const servedTokens = typedTokens.filter(
                    (t) => t.status === "served"
                ).length;
                const waitingTokens = typedTokens.filter(
                    (t) => t.status === "waiting"
                ).length;

                const servedWithTimes = typedTokens.filter(
                    (
                        t
                    ): t is QueueToken & { completed_at: string; created_at: string } =>
                        t.status === "served" && !!t.completed_at && !!t.created_at
                );

                const avgWait =
                    servedWithTimes.length > 0
                        ? servedWithTimes.reduce((acc, t) => {
                            const wait =
                                (new Date(t.completed_at).getTime() -
                                    new Date(t.created_at).getTime()) /
                                60000;
                            return acc + wait;
                        }, 0) / servedWithTimes.length
                        : 0;

                stats = {
                    activeTokens,
                    servedToday: servedTokens,
                    waitingTokens,
                    averageWaitTime: Math.round(avgWait),
                };
            }

            const { data: appointments } = await supabase
                .from("appointments")
                .select("*, doctors(profiles(full_name))")
                .eq("business_id", staffAssignment.business_id)
                .eq("appointment_date", today)
                .in("status", ["scheduled", "confirmed", "waiting"])
                .order("appointment_time", { ascending: true })
                .limit(5);

            return {
                assignment: staffAssignment as StaffAssignment,
                queues: queuesData,
                stats,
                todayAppointments: (appointments as Appointment[]) || [],
            };
        },
        enabled: !!profile?.id,
        staleTime: 5 * 60 * 1000,
    });
}
