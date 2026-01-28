import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type CompletePayload = {
  token: string;
  user_id?: string;
  email: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompletePayload;
    const { token, user_id, email } = body || {};

    if (!token || !email) {
      return NextResponse.json(
        { error: "Missing token or email" },
        { status: 400 }
      );
    }

    const adminClient = createAdminSupabaseClient();
    const { data: invitation, error: inviteError } = await adminClient
      .from("invitations")
      .select("id, email, role, status, expires_at, business_id")
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Invitation is not active" },
        { status: 400 }
      );
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }

    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Invitation email mismatch" },
        { status: 403 }
      );
    }

    if (user_id) {
      const { data: business } = await adminClient
        .from("businesses")
        .select("business_type")
        .eq("id", invitation.business_id)
        .single();

      const { error: profileError } = await adminClient
        .from("profiles")
        .update({
          role: invitation.role,
          business_type: business?.business_type ?? null,
        })
        .eq("id", user_id);

      if (profileError) {
        return NextResponse.json(
          { error: "Failed to update profile role" },
          { status: 500 }
        );
      }
    }

    await adminClient
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    return NextResponse.json({ success: true, role: invitation.role });
  } catch (error) {
    console.error("Invitation complete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

