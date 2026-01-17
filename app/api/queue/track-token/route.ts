import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get("tokenId");

    if (!tokenId) {
      return NextResponse.json(
        { error: "Token ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get token details
    const { data: token, error: tokenError } = await supabase
      .from("queue_tokens")
      .select("*, queues(name, estimated_wait_time), hospitals(name, address)")
      .eq("id", tokenId)
      .single();

    if (tokenError || !token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // Get position in queue
    const { data: position } = await supabase.rpc("get_token_position", {
      p_token_id: tokenId,
    });

    // Get estimated wait time
    const estimatedWait = position * (token.queues.estimated_wait_time || 15);

    return NextResponse.json({
      success: true,
      token,
      position,
      estimatedWait,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
