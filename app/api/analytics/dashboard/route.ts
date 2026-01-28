import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!businessId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: appointmentStats } = await supabase
      .rpc("get_appointment_stats", {
        p_business_id: businessId,
        p_start_date: startDate,
        p_end_date: endDate,
      })
      .single();

    const [dailyTokens, dailyAppointments] = await Promise.all([
      supabase
        .from("queue_tokens")
        .select("created_at")
        .eq("business_id", businessId)
        .gte("created_at", startDate)
        .lte("created_at", endDate),
      supabase
        .from("appointments")
        .select("appointment_date")
        .eq("business_id", businessId)
        .gte("appointment_date", startDate)
        .lte("appointment_date", endDate)
    ]);

    const tokensByDate = dailyTokens?.data?.reduce<Record<string, number>>(
      (acc, token) => {
        const date = token.created_at.split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {}
    ) || {};

    const appointmentsByDate = dailyAppointments?.data?.reduce<Record<string, number>>(
      (acc, appointment) => {
        const date = appointment.appointment_date;
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {}
    ) || {};

    return NextResponse.json({
      success: true,
      analytics: {
        appointments: appointmentStats,
        appointmentsByDate,
        tokens: tokensByDate,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
