import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const {
      business_id,
      doctor_id,
      patient_id, 
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

    if (
      !business_id ||
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

    const { data: appointmentNumber } = await supabase.rpc(
      "get_next_appointment_number",
      {
        p_doctor_id: doctor_id,
        p_appointment_date: appointment_date,
      }
    );

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        business_id,
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
        status: "pending",
        approval_status: "pending",
      })
      .select(
        "*, doctors(profiles(full_name), specializations(name)), businesses(name)"
      )
      .single();

    if (insertError) {
      console.error("Insert Error:", insertError);
      return NextResponse.json(
        { error: "Failed to create appointment" },
        { status: 500 }
      );
    }


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
