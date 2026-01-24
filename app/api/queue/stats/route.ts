import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queueId = searchParams.get("queueId");

    if (!queueId) {
      return NextResponse.json(
        { error: "Queue ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: stats, error } = await supabase
      .rpc("get_queue_stats", { p_queue_id: queueId })
      .single();

    if (error) {
      console.error("RPC Error:", error);
      return NextResponse.json(
        { error: "Failed to get queue stats" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
