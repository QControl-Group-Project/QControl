import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, record, old_record } = body;

    console.log("Appointment Webhook:", { type, appointmentId: record?.id });

    if (type !== "UPDATE") {
      return NextResponse.json({ success: true });
    }

    const supabase = await createServerSupabaseClient();

    const { data: appointment } = await supabase
      .from("appointments")
      .select("*, doctors(profiles(full_name)), hospitals(name)")
      .eq("id", record.id)
      .single();

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (old_record.status !== record.status) {
      const statusChanged = {
        from: old_record.status,
        to: record.status,
      };

      console.log("Status changed:", statusChanged);

      switch (record.status) {
        case "confirmed":
          console.log("Send confirmation notification");
          break;

        case "cancelled":
          console.log("Send cancellation notification");
          break;

        case "completed":
          console.log("Send completion notification");
          break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
