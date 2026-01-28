import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const { queue_id, is_active } = body;

    if (!queue_id || typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: queue_id and is_active" },
        { status: 400 }
      );
    }

    
    const { data: queue, error: fetchError } = await supabase
      .from("queues")
      .select("*, businesses(admin_id)")
      .eq("id", queue_id)
      .single();

    if (fetchError || !queue) {
      return NextResponse.json(
        { error: "Queue not found" },
        { status: 404 }
      );
    }

    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    
    const isAdmin = queue.businesses?.admin_id === user.id;
    
    if (!isAdmin) {
      
      const { data: staffAssignment } = await supabase
        .from("queue_staff_assignments")
        .select("id")
        .eq("staff_id", user.id)
        .eq("queue_id", queue_id)
        .eq("is_active", true)
        .single();

      if (!staffAssignment) {
        return NextResponse.json(
          { error: "You are not authorized to manage this queue" },
          { status: 403 }
        );
      }
    }

    const { data: updatedQueue, error: updateError } = await supabase
      .from("queues")
      .update({ 
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", queue_id)
      .select("*, departments(name)")
      .single();

    if (updateError) {
      console.error("Update Error:", updateError);
      return NextResponse.json(
        { error: "Failed to update queue status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      queue: updatedQueue,
      message: is_active ? "Queue is now open" : "Queue is now closed",
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

