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
import { Hospital, Profile, Department, Specialization } from "@/lib/types";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

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

export default function NewDoctorPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [hospital, setHospital] = useState<Hospital | null>(null);
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

  const loadData = async () => {
    if (!profile) return;

    const { data: hospitalData } = await supabase
      .from("hospitals")
      .select("*")
      .eq("admin_id", profile.id)
      .single();

    setHospital((hospitalData as Hospital) || null);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "doctor");

    setProfiles((profileData as Profile[]) || []);

    if (hospitalData?.id) {
      const { data: deptData } = await supabase
        .from("departments")
        .select("*")
        .eq("hospital_id", hospitalData.id);
      setDepartments((deptData as Department[]) || []);
    }

    const { data: specData } = await supabase
      .from("specializations")
      .select("*");
    setSpecializations((specData as Specialization[]) || []);
  };

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
    }
  }, [profile]);

  const handleCreateDoctor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hospital) return;

    const { error } = await supabase.from("doctors").insert({
      profile_id: form.profile_id,
      hospital_id: hospital.id,
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

    toast.success("Doctor added");
    router.push("/admin/doctors");
  };

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hospital) return;

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { error } = await supabase.from("invitations").insert({
      hospital_id: hospital.id,
      email: invite.email,
      role: "doctor",
      token,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Doctor invitation created");
    setInvite({ email: "" });
  };

  if (!hospital) {
    return (
      <div className="p-6">
        <EmptyState
          icon={UserPlus}
          title="Hospital not found"
          description="Create your hospital profile before adding doctors."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Add Doctor" description="Assign a doctor to your hospital" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assign Existing Doctor Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDoctor} className="space-y-3">
              <div>
                <Label htmlFor="profile_id">Doctor profile</Label>
                <select
                  id="profile_id"
                  className="w-full p-2 border rounded-md"
                  value={form.profile_id}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, profile_id: event.target.value }))
                  }
                  required
                >
                  <option value="">Select doctor...</option>
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
              </div>

              <div>
                <Label htmlFor="specialization_id">Specialization</Label>
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
                  <Label htmlFor="consultation_fee">Consultation Fee</Label>
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
                Available for appointments
              </label>

              <Button type="submit">Add Doctor</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <Label htmlFor="inviteEmail">Doctor email</Label>
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

