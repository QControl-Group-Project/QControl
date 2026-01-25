"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Department, Hospital } from "@/lib/types";
import { toast } from "sonner";

type QueueFormState = {
  name: string;
  description: string;
  department_id: string;
  max_tokens_per_day: string;
  estimated_wait_time: string;
  opening_time: string;
  closing_time: string;
};

export default function NewQueuePage() {
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState<QueueFormState>({
    name: "",
    description: "",
    department_id: "",
    max_tokens_per_day: "100",
    estimated_wait_time: "15",
    opening_time: "",
    closing_time: "",
  });

  const loadData = async () => {
    if (!profile) return;
    const { data: hospitalData } = await supabase
      .from("hospitals")
      .select("*")
      .eq("admin_id", profile.id)
      .single();

    setHospital((hospitalData as Hospital) || null);

    if (hospitalData?.id) {
      const { data: deptData } = await supabase
        .from("departments")
        .select("*")
        .eq("hospital_id", hospitalData.id);
      setDepartments((deptData as Department[]) || []);
    }
  };

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [profile]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hospital) return;

    const { error } = await supabase.from("queues").insert({
      hospital_id: hospital.id,
      department_id: form.department_id || null,
      name: form.name,
      description: form.description || null,
      max_tokens_per_day: Number(form.max_tokens_per_day || 0),
      estimated_wait_time: Number(form.estimated_wait_time || 0),
      opening_time: form.opening_time || null,
      closing_time: form.closing_time || null,
      is_active: true,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Queue created");
    router.push("/admin/queues");
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Create Queue" description="Add a new hospital queue" />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Queue Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_tokens_per_day">Max Tokens per Day</Label>
                <Input
                  id="max_tokens_per_day"
                  type="number"
                  value={form.max_tokens_per_day}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      max_tokens_per_day: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="estimated_wait_time">
                  Estimated Wait (minutes)
                </Label>
                <Input
                  id="estimated_wait_time"
                  type="number"
                  value={form.estimated_wait_time}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      estimated_wait_time: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="opening_time">Opening Time</Label>
                <Input
                  id="opening_time"
                  type="time"
                  value={form.opening_time}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      opening_time: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="closing_time">Closing Time</Label>
                <Input
                  id="closing_time"
                  type="time"
                  value={form.closing_time}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      closing_time: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <Button type="submit">Create Queue</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

