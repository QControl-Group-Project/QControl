import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// This webhook sends notifications when appointment status changes
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, record, old_record } = body;

    console.log("Appointment Webhook:", { type, appointmentId: record?.id });

    // Only process updates
    if (type !== "UPDATE") {
      return NextResponse.json({ success: true });
    }

    const supabase = await createServerSupabaseClient();

    // Get full appointment details
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

    // Check if status changed
    if (old_record.status !== record.status) {
      const statusChanged = {
        from: old_record.status,
        to: record.status,
      };

      console.log("Status changed:", statusChanged);

      // TODO: Send notifications based on status
      switch (record.status) {
        case "confirmed":
          // await sendConfirmationEmail(appointment)
          // await sendConfirmationSMS(appointment)
          console.log("Send confirmation notification");
          break;

        case "cancelled":
          // await sendCancellationEmail(appointment)
          console.log("Send cancellation notification");
          break;

        case "completed":
          // await sendCompletionEmail(appointment)
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
