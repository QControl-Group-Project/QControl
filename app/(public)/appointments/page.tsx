import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentBookingForm } from "@/components/forms/AppointmentBookingForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AppointmentBookingPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Book an Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentBookingForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
