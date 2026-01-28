import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: "Doctor ID and date are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const dayOfWeek = new Date(date).getDay();

    const { data: schedules } = await supabase
      .from("doctor_schedules")
      .select("*")
      .eq("doctor_id", doctorId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        success: true,
        slots: [],
        message: "No schedule found for this day",
      });
    }

    const slots = [];
    for (const schedule of schedules) {
      const [startHour, startMin] = schedule.start_time.split(":").map(Number);
      const [endHour, endMin] = schedule.end_time.split(":").map(Number);

      let currentTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      while (currentTime < endTime) {
        const hour = Math.floor(currentTime / 60);
        const min = currentTime % 60;
        const timeStr = `${hour.toString().padStart(2, "0")}:${min
          .toString()
          .padStart(2, "0")}:00`;

        const { data: isAvailable } = await supabase.rpc(
          "check_doctor_availability",
          {
            p_doctor_id: doctorId,
            p_appointment_date: date,
            p_appointment_time: timeStr,
          }
        );

        if (isAvailable) {
          slots.push({
            time: timeStr,
            displayTime: `${hour.toString().padStart(2, "0")}:${min
              .toString()
              .padStart(2, "0")}`,
            available: true,
          });
        }

        currentTime += schedule.slot_duration;
      }
    }

    return NextResponse.json({
      success: true,
      slots,
      date,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
