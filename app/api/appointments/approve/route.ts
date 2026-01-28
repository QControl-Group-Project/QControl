import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const { appointment_id, action, reason, notes } = body;

    if (!appointment_id || !action) {
      return NextResponse.json(
        { error: "Missing required fields: appointment_id and action" },
        { status: 400 }
      );
    }

    if (!["approve", "reject", "cancel"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve', 'reject', or 'cancel'" },
        { status: 400 }
      );
    }

    
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("*, doctors(profile_id)")
      .eq("id", appointment_id)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
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

    
    const { data: doctor } = await supabase
      .from("doctors")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!doctor || doctor.id !== appointment.doctor_id) {
      
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("admin_id", user.id)
        .eq("id", appointment.business_id)
        .single();

      if (!business) {
        return NextResponse.json(
          { error: "You are not authorized to manage this appointment" },
          { status: 403 }
        );
      }
    }

    let updateData: Record<string, unknown> = {};
    const now = new Date().toISOString();

    switch (action) {
      case "approve":
        updateData = {
          approval_status: "approved",
          status: "confirmed",
          approved_at: now,
          confirmed_at: now,
          ...(notes && { notes }),
        };
        break;

      case "reject":
        if (!reason) {
          return NextResponse.json(
            { error: "Rejection reason is required" },
            { status: 400 }
          );
        }
        updateData = {
          approval_status: "rejected",
          status: "rejected",
          rejection_reason: reason,
          rejected_at: now,
        };
        break;

      case "cancel":
        if (!reason) {
          return NextResponse.json(
            { error: "Cancellation reason is required" },
            { status: 400 }
          );
        }
        updateData = {
          status: "cancelled",
          cancellation_reason: reason,
          cancelled_at: now,
        };
        break;
    }

    const { data: updatedAppointment, error: updateError } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointment_id)
      .select("*, doctors(profiles(full_name), specializations(name)), businesses(name)")
      .single();

    if (updateError) {
      console.error("Update Error:", updateError);
      return NextResponse.json(
        { error: "Failed to update appointment" },
        { status: 500 }
      );
    }

    

    const actionMessages: Record<string, string> = {
      approve: "Appointment approved successfully",
      reject: "Appointment rejected",
      cancel: "Appointment cancelled",
    };

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: actionMessages[action],
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

