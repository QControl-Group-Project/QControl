"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { PageHeader } from "@/components/layouts/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/layouts/loadingSpinner";
import { toast } from "sonner";
import { Department, Business, Specialization } from "@/lib/types";

type NewDepartment = {
  name: string;
  description: string;
  floor_number: string;
  contact_number: string;
};

type NewService = {
  name: string;
  description: string;
};

export default function AdminSettingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [business, setBusiness] = useState<Business | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [services, setServices] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingDepartment, setSavingDepartment] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [newDepartment, setNewDepartment] = useState<NewDepartment>({
    name: "",
    description: "",
    floor_number: "",
    contact_number: "",
  });
  const [newService, setNewService] = useState<NewService>({
    name: "",
    description: "",
  });

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);

    const { data: businessData } = await supabase
      .from("businesses")
      .select("*")
      .eq("admin_id", profile.id)
      .single();

    setBusiness((businessData as Business) || null);

    if (businessData?.id) {
      const { data: deptData } = await supabase
        .from("departments")
        .select("*")
        .eq("business_id", businessData.id)
        .order("name");
      setDepartments((deptData as Department[]) || []);
    }

    const { data: serviceData } = await supabase
      .from("specializations")
      .select("*")
      .order("name");
    setServices((serviceData as Specialization[]) || []);

    setLoading(false);
  };

  useEffect(() => {
    if (profile) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [profile, authLoading]);

  const handleAddDepartment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!business) return;

    if (!newDepartment.name.trim()) {
      toast.error("Department name is required");
      return;
    }

    setSavingDepartment(true);
    const { error } = await supabase.from("departments").insert({
      business_id: business.id,
      name: newDepartment.name.trim(),
      description: newDepartment.description.trim() || null,
      floor_number: newDepartment.floor_number
        ? Number(newDepartment.floor_number)
        : null,
      contact_number: newDepartment.contact_number.trim() || null,
      is_active: true,
    });

    if (error) {
      toast.error(error.message);
      setSavingDepartment(false);
      return;
    }

    toast.success("Department added");
    setNewDepartment({
      name: "",
      description: "",
      floor_number: "",
      contact_number: "",
    });
    await loadData();
    setSavingDepartment(false);
  };

  const handleAddService = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newService.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    setSavingService(true);
    const { error } = await supabase.from("specializations").insert({
      name: newService.name.trim(),
      description: newService.description.trim() || null,
    });

    if (error) {
      toast.error(error.message);
      setSavingService(false);
      return;
    }

    toast.success("Service added");
    setNewService({ name: "", description: "" });
    await loadData();
    setSavingService(false);
  };

  if (loading || authLoading) return <LoadingSpinner />;

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">
          You need to be logged in to manage services and departments.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Services & Departments"
        description="Manage service offerings and departments for your business"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Department</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDepartment} className="space-y-3">
              <div>
                <Label htmlFor="department_name">Department Name *</Label>
                <Input
                  id="department_name"
                  value={newDepartment.name}
                  onChange={(event) =>
                    setNewDepartment((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="department_description">Description</Label>
                <Textarea
                  id="department_description"
                  value={newDepartment.description}
                  onChange={(event) =>
                    setNewDepartment((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="department_floor">Floor</Label>
                  <Input
                    id="department_floor"
                    type="number"
                    value={newDepartment.floor_number}
                    onChange={(event) =>
                      setNewDepartment((prev) => ({
                        ...prev,
                        floor_number: event.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="department_contact">Contact Number</Label>
                  <Input
                    id="department_contact"
                    value={newDepartment.contact_number}
                    onChange={(event) =>
                      setNewDepartment((prev) => ({
                        ...prev,
                        contact_number: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <Button type="submit" disabled={savingDepartment}>
                {savingDepartment ? "Saving..." : "Add Department"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Service</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddService} className="space-y-3">
              <div>
                <Label htmlFor="service_name">Service Name *</Label>
                <Input
                  id="service_name"
                  value={newService.name}
                  onChange={(event) =>
                    setNewService((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="service_description">Description</Label>
                <Textarea
                  id="service_description"
                  value={newService.description}
                  onChange={(event) =>
                    setNewService((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <Button type="submit" disabled={savingService}>
                {savingService ? "Saving..." : "Add Service"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
          </CardHeader>
          <CardContent>
            {departments.length === 0 ? (
              <p className="text-sm text-gray-500">No departments added yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      {dept.description && (
                        <p className="text-xs text-gray-500">
                          {dept.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {dept.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <p className="text-sm text-gray-500">No services added yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.description && (
                        <p className="text-xs text-gray-500">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

