"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/layouts/EmptyState";
import { Trash2, Users } from "lucide-react";
import { Profile, StaffAssignment } from "@/lib/types";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

type InviteForm = {
  email: string;
  role: "staff" | "provider";
};

export default function AdminStaffPage() {
  const { profile } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffAssignment[]>([]);
  const [staffProfilesById, setStaffProfilesById] = useState<
    Record<string, Profile>
  >({});
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invite, setInvite] = useState<InviteForm>({
    email: "",
    role: "staff",
  });
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const supabase = createClient();

  const loadBusiness = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("businesses")
      .select("id, business_type")
      .eq("admin_id", profile.id)
      .single();
    setBusinessId(data?.id ?? null);
    setBusinessType(data?.business_type ?? null);
  };

  const loadStaff = async (hId: string) => {
    const { data } = await supabase
      .from("staff_assignments")
      .select("*")
      .eq("business_id", hId)
      .order("created_at", { ascending: false });

    const assignments = (data as StaffAssignment[]) || [];
    setStaff(assignments);

    const staffIds = assignments.map((item) => item.staff_id);
    if (staffIds.length === 0) {
      setStaffProfilesById({});
      return;
    }

    const { data: staffProfiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", staffIds);

    const map: Record<string, Profile> = {};
    (staffProfiles as Profile[] | null)?.forEach((p) => {
      map[p.id] = p;
    });
    setStaffProfilesById(map);
  };

  const loadProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["staff", "provider"]);

    setProfiles((data as Profile[]) || []);
  };

  useEffect(() => {
    if (profile) {
      loadBusiness();
      loadProfiles();
    }
  }, [profile]);

  useEffect(() => {
    if (businessId) {
      loadStaff(businessId);
    }
  }, [businessId]);

  const staffProfiles = useMemo(
    () => profiles.filter((p) => p.role === "staff"),
    [profiles]
  );

  const providerLabel = "Provider";

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!businessId) return;

    try {
      const result = await apiClient.post<{ success: boolean; error?: string }>(
        "/invitations/send",
        {
          business_id: businessId,
          email: invite.email,
          role: invite.role,
        }
      );

      if (!result?.success) {
        toast.error(result?.error || "Failed to send invitation");
        return;
      }
    } catch (error) {
      console.error("Failed to send invitation:", error);
      toast.error("Failed to send invitation");
      return;
    }

    toast.success("Invitation created");
    setInvite({ email: "", role: invite.role });
  };

  const handleAssignStaff = async () => {
    if (!businessId || !selectedProfileId) return;
    const { error } = await supabase.from("staff_assignments").insert({
      staff_id: selectedProfileId,
      business_id: businessId,
      role: "staff",
      is_active: true,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Staff assigned");
    setSelectedProfileId("");
    loadStaff(businessId);
  };

  const handleRemoveStaff = async (assignmentId: string, staffName?: string) => {
    if (!businessId) return;
    const confirmed = window.confirm(
      `Remove ${staffName ?? "this staff member"} from your business?`
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("staff_assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Staff removed");
    setStaff((prev) => prev.filter((item) => item.id !== assignmentId));
  };

  if (!businessId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Users}
          title="No business found"
          description="Create your business profile first."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Staff"
        description="Manage staff assignments for your business"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assign Existing Staff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="staffProfile">Select staff profile</Label>
            <select
              id="staffProfile"
              className="w-full p-2 border rounded-md"
              value={selectedProfileId}
              onChange={(event) => setSelectedProfileId(event.target.value)}
            >
              <option value="">Choose staff...</option>
              {staffProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.email})
                </option>
              ))}
            </select>
            <Button onClick={handleAssignStaff} disabled={!selectedProfileId}>
              Assign Staff
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite Staff or {providerLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <Label htmlFor="inviteEmail">Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={invite.email}
                  onChange={(event) =>
                    setInvite((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="inviteRole">Role</Label>
                <select
                  id="inviteRole"
                  className="w-full p-2 border rounded-md"
                  value={invite.role}
                  onChange={(event) =>
                    setInvite((prev) => ({
                      ...prev,
                      role: event.target.value as InviteForm["role"],
                    }))
                  }
                >
                  <option value="staff">Staff</option>
                  <option value="provider">{providerLabel}</option>
                </select>
              </div>
              <Button type="submit">Create Invitation</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Staff</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No staff assigned"
              description="Assign staff to manage business queues."
            />
          ) : (
            <div className="space-y-3">
              {staff.map((item) => {
                const staffProfile = staffProfilesById[item.staff_id];
                return (
                <div
                  key={item.id}
                  className="flex items-center justify-between border rounded-md p-3"
                >
                  <div>
                    <p className="font-medium">
                      {staffProfile?.full_name ?? "Staff Member"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {staffProfile?.email ?? item.staff_id}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {item.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        handleRemoveStaff(item.id, staffProfile?.full_name)
                      }
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

