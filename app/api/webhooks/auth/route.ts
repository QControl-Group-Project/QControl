import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, record } = body;

    console.log("Auth Webhook:", { type, userId: record?.id });

    const supabase = await createServerSupabaseClient();

    switch (type) {
      case "INSERT": 
        console.log("New user signed up:", record.id);
        break;

      case "UPDATE": 
        if (record.email) {
          await supabase
            .from("profiles")
            .update({ email: record.email })
            .eq("id", record.id);
        }
        break;

      case "DELETE": 
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
