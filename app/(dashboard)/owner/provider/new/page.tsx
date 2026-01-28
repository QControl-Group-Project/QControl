"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/layouts/EmptyState";
import { Business, Profile, Department, Specialization } from "@/lib/types";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { apiClient } from "@/lib/api-client";

type DoctorFormState = {
  profile_id: string;
  department_id: string;
  specialization_id: string;
  license_number: string;
  qualification: string;
  experience_years: string;
  consultation_fee: string;
  is_available: boolean;
};

type InviteFormState = {
  email: string;
};

type NewDepartmentState = {
  name: string;
  description: string;
};

type NewServiceState = {
  name: string;
  description: string;
};

export default function NewDoctorPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [business, setBusiness] = useState<Business | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [form, setForm] = useState<DoctorFormState>({
    profile_id: "",
    department_id: "",
    specialization_id: "",
    license_number: "",
    qualification: "",
    experience_years: "",
    consultation_fee: "",
    is_available: true,
  });
  const [invite, setInvite] = useState<InviteFormState>({ email: "" });
  const [newDepartment, setNewDepartment] = useState<NewDepartmentState>({
    name: "",
    description: "",
  });
  const [newService, setNewService] = useState<NewServiceState>({
    name: "",
    description: "",
  });
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [addingService, setAddingService] = useState(false);
  const providerLabel = "Provider";

  const loadData = async () => {
    if (!profile) return;

    const { data: businessData } = await supabase
      .from("businesses")
      .select("*")
      .eq("admin_id", profile.id)
      .single();

    setBusiness((businessData as Business) || null);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "provider");

    setProfiles((profileData as Profile[]) || []);

    if (businessData?.id) {
      const { data: deptData } = await supabase
        .from("departments")
        .select("*")
        .eq("business_id", businessData.id);
      setDepartments((deptData as Department[]) || []);
    }

    const { data: specData } = await supabase
      .from("specializations")
      .select("*");
    setSpecializations((specData as Specialization[]) || []);
  };

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [profile]);

  const handleCreateDoctor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!business) return;

    const { error } = await supabase.from("doctors").insert({
      profile_id: form.profile_id,
      business_id: business.id,
      department_id: form.department_id || null,
      specialization_id: form.specialization_id || null,
      license_number: form.license_number || null,
      qualification: form.qualification || null,
      experience_years: form.experience_years
        ? Number(form.experience_years)
        : null,
      consultation_fee: form.consultation_fee
        ? Number(form.consultation_fee)
        : null,
      is_available: form.is_available,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    await supabase
      .from("profiles")
      .update({ business_type: business.business_type ?? null })
      .eq("id", form.profile_id);

    toast.success(`${providerLabel} added`);
    router.push("/owner/doctors");
  };

  const handleAddDepartment = async () => {
    if (!business) return;
    if (!newDepartment.name.trim()) {
      toast.error("Department name is required");
      return;
    }

    setAddingDepartment(true);
    const { data, error } = await supabase
      .from("departments")
      .insert({
        business_id: business.id,
        name: newDepartment.name.trim(),
        description: newDepartment.description.trim() || null,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) {
      toast.error(error.message);
      setAddingDepartment(false);
      return;
    }

    setDepartments((prev) => [...prev, data as Department]);
    setForm((prev) => ({ ...prev, department_id: data.id }));
    setNewDepartment({ name: "", description: "" });
    setAddingDepartment(false);
  };

  const handleAddService = async () => {
    if (!newService.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    setAddingService(true);
    const { data, error } = await supabase
      .from("specializations")
      .insert({
        name: newService.name.trim(),
        description: newService.description.trim() || null,
      })
      .select("*")
      .single();

    if (error) {
      toast.error(error.message);
      setAddingService(false);
      return;
    }

    setSpecializations((prev) => [...prev, data as Specialization]);
    setForm((prev) => ({ ...prev, specialization_id: data.id }));
    setNewService({ name: "", description: "" });
    setAddingService(false);
  };

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!business) return;

    try {
      const result = await apiClient.post<{ success: boolean; error?: string }>(
        "/invitations/send",
        {
          business_id: business.id,
          email: invite.email,
          role: "provider",
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

    toast.success(`${providerLabel} invitation created`);
    setInvite({ email: "" });
  };

  if (!business) {
    return (
      <div className="p-6">
        <EmptyState
          icon={UserPlus}
          title="Business not found"
          description="Create your business profile before adding providers."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Add ${providerLabel}`}
        description="Assign a provider to your business"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assign Existing {providerLabel} Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDoctor} className="space-y-3">
              <div>
                <Label htmlFor="profile_id">Provider profile</Label>
                <select
                  id="profile_id"
                  className="w-full p-2 border rounded-md"
                  value={form.profile_id}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, profile_id: event.target.value }))
                  }
                  required
                >
                  <option value="">Select provider...</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="department_id">Department</Label>
                <select
                  id="department_id"
                  className="w-full p-2 border rounded-md"
                  value={form.department_id}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      department_id: event.target.value,
                    }))
                  }
                >
                  <option value="">No department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Input
                    placeholder="Add new department"
                    value={newDepartment.name}
                    onChange={(event) =>
                      setNewDepartment((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Department description (optional)"
                    value={newDepartment.description}
                    onChange={(event) =>
                      setNewDepartment((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddDepartment}
                    disabled={addingDepartment}
                  >
                    {addingDepartment ? "Adding..." : "Add Department"}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="specialization_id">Service Type</Label>
                <select
                  id="specialization_id"
                  className="w-full p-2 border rounded-md"
                  value={form.specialization_id}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      specialization_id: event.target.value,
                    }))
                  }
                >
                  <option value="">No specialization</option>
                  {specializations.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Input
                    placeholder="Add new service"
                    value={newService.name}
                    onChange={(event) =>
                      setNewService((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Service description (optional)"
                    value={newService.description}
                    onChange={(event) =>
                      setNewService((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddService}
                    disabled={addingService}
                  >
                    {addingService ? "Adding..." : "Add Service"}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  value={form.license_number}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      license_number: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  value={form.qualification}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      qualification: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="experience_years">Experience (years)</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={form.experience_years}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        experience_years: event.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                <Label htmlFor="consultation_fee">Service Fee</Label>
                  <Input
                    id="consultation_fee"
                    type="number"
                    value={form.consultation_fee}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        consultation_fee: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      is_available: event.target.checked,
                    }))
                  }
                />
                Available for bookings
              </label>

              <Button type="submit">Add {providerLabel}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite {providerLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <Label htmlFor="inviteEmail">{providerLabel} email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={invite.email}
                  onChange={(event) =>
                    setInvite({ email: event.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit">Create Invitation</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

