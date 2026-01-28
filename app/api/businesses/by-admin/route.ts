import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return NextResponse.json(
        { error: "Missing adminId parameter" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("admin_id", adminId)
      .single();

    if (error) {
      console.error("Error fetching business:", error);
      return NextResponse.json(
        { error: "Failed to fetch business data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      business: business
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}