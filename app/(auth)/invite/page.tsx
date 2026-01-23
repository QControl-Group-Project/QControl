"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteSignupForm } from "@/components/forms/inviteSignupForm";
import { LoadingSpinner } from "@/components/layouts/loadingSpinner";

type InvitationDetails = {
  email: string;
  role: "doctor" | "staff";
  hospital_id: string;
};

export default function InviteSignupPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);

  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError("Invitation token is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/invitations/validate?token=${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (!response.ok || !data?.invitation) {
          setError(data?.error || "Invalid invitation.");
          return;
        }

        setInvitation(data.invitation as InvitationDetails);
      } catch (err) {
        setError("Failed to load invitation.");
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  if (loading) {
    return <LoadingSpinner text="Loading invitation..." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accept Invitation</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          invitation && (
            <InviteSignupForm
              token={token as string}
              email={invitation.email}
              role={invitation.role}
            />
          )
        )}
      </CardContent>
    </Card>
  );
}

