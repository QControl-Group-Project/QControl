import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const {
      queue_id,
      hospital_id,
      patient_name,
      patient_phone,
      patient_age,
      purpose,
      patient_id, // Optional - will be null for unauthenticated users
    } = body;

    // Validate required fields
    if (!queue_id || !hospital_id || !patient_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if queue is active and has capacity
    const { data: queue } = await supabase
      .from("queues")
      .select("*")
      .eq("id", queue_id)
      .single();

    if (!queue || !queue.is_active) {
      return NextResponse.json(
        { error: "Queue is not available" },
        { status: 400 }
      );
    }

    // Get token count for today
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("queue_tokens")
      .select("*", { count: "exact", head: true })
      .eq("queue_id", queue_id)
      .gte("created_at", today);

    if (count && count >= queue.max_tokens_per_day) {
      return NextResponse.json(
        { error: "Queue has reached maximum capacity for today" },
        { status: 400 }
      );
    }

    // Get next token number
    const { data: tokenNumber, error: rpcError } = await supabase.rpc(
      "get_next_queue_token_number",
      { p_queue_id: queue_id }
    );

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      return NextResponse.json(
        { error: "Failed to generate token number" },
        { status: 500 }
      );
    }

    // Create token
    const { data: token, error: insertError } = await supabase
      .from("queue_tokens")
      .insert({
        queue_id,
        hospital_id,
        token_number: tokenNumber,
        patient_id,
        patient_name,
        patient_phone,
        patient_age,
        purpose,
        status: "waiting",
      })
      .select("*, queues(name, estimated_wait_time), hospitals(name)")
      .single();

    if (insertError) {
      console.error("Insert Error:", insertError);
      return NextResponse.json(
        { error: "Failed to create token" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token,
      message: "Token generated successfully",
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
