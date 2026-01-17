import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// This webhook sends notifications when token status changes
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, record, old_record } = body;

    console.log("Token Webhook:", { type, tokenId: record?.id });

    // Only process updates
    if (type !== "UPDATE") {
      return NextResponse.json({ success: true });
    }

    const supabase = await createServerSupabaseClient();

    // Get full token details
    const { data: token } = await supabase
      .from("queue_tokens")
      .select("*, queues(name), hospitals(name)")
      .eq("id", record.id)
      .single();

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // Check if status changed to 'called'
    if (old_record.status !== "called" && record.status === "called") {
      console.log(`Token #${token.token_number} has been called`);

      // TODO: Send notifications
      if (token.patient_phone) {
        // await sendSMS(token.patient_phone, `Your token #${token.token_number} has been called. Please proceed to ${token.queues.name}`)
        console.log("Send SMS notification");
      }

      // If patient is logged in, send push notification
      if (token.patient_id) {
        // await sendPushNotification(token.patient_id, ...)
        console.log("Send push notification");
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
