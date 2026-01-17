import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const {
      hospital_id,
      doctor_id,
      patient_id, // Optional for unauthenticated users
      patient_name,
      patient_phone,
      patient_email,
      patient_age,
      patient_gender,
      appointment_date,
      appointment_time,
      appointment_type,
      symptoms,
    } = body;

    // Validate required fields
    if (
      !hospital_id ||
      !doctor_id ||
      !patient_name ||
      !appointment_date ||
      !appointment_time
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check doctor availability
    const { data: isAvailable } = await supabase.rpc(
      "check_doctor_availability",
      {
        p_doctor_id: doctor_id,
        p_appointment_date: appointment_date,
        p_appointment_time: appointment_time,
      }
    );

    if (!isAvailable) {
      return NextResponse.json(
        { error: "Selected time slot is not available" },
        { status: 400 }
      );
    }

    // Get next appointment number
    const { data: appointmentNumber } = await supabase.rpc(
      "get_next_appointment_number",
      {
        p_doctor_id: doctor_id,
        p_appointment_date: appointment_date,
      }
    );

    // Create appointment
    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        hospital_id,
        doctor_id,
        patient_id,
        appointment_number: appointmentNumber,
        patient_name,
        patient_phone,
        patient_email,
        patient_age,
        patient_gender,
        appointment_date,
        appointment_time,
        appointment_type: appointment_type || "consultation",
        symptoms,
        status: "scheduled",
      })
      .select(
        "*, doctors(profiles(full_name), specializations(name)), hospitals(name)"
      )
      .single();

    if (insertError) {
      console.error("Insert Error:", insertError);
      return NextResponse.json(
        { error: "Failed to create appointment" },
        { status: 500 }
      );
    }

    // TODO: Send confirmation email/SMS

    return NextResponse.json({
      success: true,
      appointment,
      message: "Appointment booked successfully",
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
