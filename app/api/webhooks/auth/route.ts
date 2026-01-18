import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// This webhook handles auth events from Supabase
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, record } = body;

    console.log("Auth Webhook:", { type, userId: record?.id });

    const supabase = await createServerSupabaseClient();

    switch (type) {
      case "INSERT": // User signup
        // Profile is created automatically by trigger
        // You can add additional logic here
        console.log("New user signed up:", record.id);
        break;

      case "UPDATE": // User update
        // Sync any changes to profile if needed
        if (record.email) {
          await supabase
            .from("profiles")
            .update({ email: record.email })
            .eq("id", record.id);
        }
        break;

      case "DELETE": // User deletion
        // Cleanup related data if needed
        console.log("User deleted:", record.id);
        break;
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
