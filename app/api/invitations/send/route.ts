import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";

type InvitePayload = {
  email: string;
  role: "staff" | "provider";
  business_id: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as InvitePayload;
    const { email, role, business_id } = body || {};

    if (!email || !role || !business_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("id", business_id)
      .eq("admin_id", user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found or access denied" },
        { status: 403 }
      );
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { data: createdInvite, error: insertError } = await supabase
      .from("invitations")
      .insert({
      business_id,
      email,
      role,
      token,
      expires_at: expiresAt.toISOString(),
      invited_by: user.id,
      })
      .select("id, token")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite?token=${token}`;
    const subject = `You're invited to join ${business.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Hello,</p>
        <p>You have been invited to join <strong>${business.name}</strong> as a ${role}.</p>
        <p>
          <a href="${inviteUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
            Accept Invitation
          </a>
        </p>
        <p>If the button does not work, copy and paste this link:</p>
        <p>${inviteUrl}</p>
        <p>This invitation expires in 7 days.</p>
      </div>
    `;

    const emailResult = await sendEmail({ to: email, subject, html });
    if (emailResult.error) {
      console.error("Invitation email failed:", emailResult.error);
      return NextResponse.json(
        { error: `Invitation created, but email failed: ${emailResult.error}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      token: createdInvite?.token ?? token,
      invitation_id: createdInvite?.id,
    });
  } catch (error) {
    console.error("Invitation API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

