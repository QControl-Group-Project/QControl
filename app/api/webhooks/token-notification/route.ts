import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, record, old_record } = body;

    console.log("Token Webhook:", { type, tokenId: record?.id });

    if (type !== "UPDATE") {
      return NextResponse.json({ success: true });
    }

    const supabase = await createServerSupabaseClient();

    const { data: token } = await supabase
      .from("queue_tokens")
      .select("*, queues(name), hospitals(name)")
      .eq("id", record.id)
      .single();

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    if (old_record.status !== "called" && record.status === "called") {
      console.log(`Token #${token.token_number} has been called`);

      if (token.patient_phone) {
        console.log("Send SMS notification");
      }

      if (token.patient_id) {
        console.log("Send push notification");
      }

      let patientEmail: string | null = null;
      if (token.patient_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", token.patient_id)
          .single();
        patientEmail = profile?.email ?? null;
      }

      if (patientEmail) {
        const subject = `Token #${token.token_number} has been called`;
        const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <p>Hello,</p>
            <p>Your queue token <strong>#${token.token_number}</strong> has been called.</p>
            <p>Queue: ${token.queues?.name ?? "Queue"}</p>
            <p>Hospital: ${token.hospitals?.name ?? "Hospital"}</p>
            <p>Please proceed to the queue desk.</p>
          </div>
        `;
        const emailResult = await sendEmail({
          to: patientEmail,
          subject,
          html,
        });
        if (emailResult.error) {
          console.error("Failed to send token email:", emailResult.error);
        }
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
