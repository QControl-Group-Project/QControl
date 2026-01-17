import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET hospital details
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: hospital } = await supabase
      .from("hospitals")
      .select("*")
      .eq("admin_id", user.id)
      .single();

    return NextResponse.json({ success: true, hospital });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create or update hospital
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...hospitalData } = body;

    let result;

    if (id) {
      // Update existing hospital
      result = await supabase
        .from("hospitals")
        .update(hospitalData)
        .eq("id", id)
        .eq("admin_id", user.id)
        .select()
        .single();
    } else {
      // Create new hospital
      result = await supabase
        .from("hospitals")
        .insert({
          ...hospitalData,
          admin_id: user.id,
        })
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      hospital: result.data,
      message: id ? "Hospital updated" : "Hospital created",
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
