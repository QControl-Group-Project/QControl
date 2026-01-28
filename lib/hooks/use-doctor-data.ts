import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Appointment, Doctor } from "@/lib/types";
import { useAuth } from "@/lib/hooks/use-auth";

const supabase = createClient();

interface DoctorDashboardStats {
    todayAppointments: number;
    upcomingAppointments: number;
    completedToday: number;
    totalPatients: number;
}

interface DoctorDashboardData {
    doctorInfo: Doctor | null;
    stats: DoctorDashboardStats;
    todayAppointments: Appointment[];
}

export function useDoctorData() {
    const { profile } = useAuth();
    const today = new Date().toISOString().split("T")[0];

    return useQuery<DoctorDashboardData>({
        queryKey: ["doctor-dashboard", profile?.id],
        queryFn: async () => {
            if (!profile?.id) throw new Error("No profile");

            const { data: doctor } = await supabase
                .from("doctors")
                .select("*, businesses(name, business_type, business_type_custom), specializations(name)")
                .eq("profile_id", profile.id)
                .single();

            if (!doctor) {
                return {
                    doctorInfo: null,
                    stats: {
                        todayAppointments: 0,
                        upcomingAppointments: 0,
                        completedToday: 0,
                        totalPatients: 0
                    },
                    todayAppointments: []
                }
            }

            const [todayAppts, upcoming, completed, patients, todayApptsList] =
                await Promise.all([
                    supabase
                        .from("appointments")
                        .select("*", { count: "exact", head: true })
                        .eq("doctor_id", doctor.id)
                        .eq("appointment_date", today),
                    supabase
                        .from("appointments")
                        .select("*", { count: "exact", head: true })
                        .eq("doctor_id", doctor.id)
                        .gte("appointment_date", today)
                        .in("status", ["scheduled", "confirmed"]),
                    supabase
                        .from("appointments")
                        .select("*", { count: "exact", head: true })
                        .eq("doctor_id", doctor.id)
                        .eq("appointment_date", today)
                        .eq("status", "completed"),
                    supabase
                        .from("appointments")
                        .select("patient_id", { count: "exact", head: true })
                        .eq("doctor_id", doctor.id)
                        .not("patient_id", "is", null),
                    supabase
                        .from("appointments")
                        .select("*")
                        .eq("doctor_id", doctor.id)
                        .eq("appointment_date", today)
                        .order("appointment_time", { ascending: true }),
                ]);

            return {
                doctorInfo: doctor as Doctor,
                todayAppointments: (todayApptsList.data as Appointment[]) || [],
                stats: {
                    todayAppointments: todayAppts.count || 0,
                    upcomingAppointments: upcoming.count || 0,
                    completedToday: completed.count || 0,
                    totalPatients: patients.count || 0,
                },
            };
        },
        enabled: !!profile?.id,
        staleTime: 5 * 60 * 1000,
    });
}
