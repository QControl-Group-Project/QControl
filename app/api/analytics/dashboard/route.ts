import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get("hospitalId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!hospitalId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get appointment stats
    const { data: appointmentStats } = await supabase
      .rpc("get_appointment_stats", {
        p_hospital_id: hospitalId,
        p_start_date: startDate,
        p_end_date: endDate,
      })
      .single();

    // Get daily token counts
    const { data: dailyTokens } = await supabase
      .from("queue_tokens")
      .select("created_at")
      .eq("hospital_id", hospitalId)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    // Group by date
    const tokensByDate = dailyTokens?.reduce<Record<string, number>>(
      (acc, token) => {
        const date = token.created_at.split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {}
    );

    return NextResponse.json({
      success: true,
      analytics: {
        appointments: appointmentStats,
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
