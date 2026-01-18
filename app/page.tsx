import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Clock, Users, Hospital, ArrowRight } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">

      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hospital className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">HospitalMS</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Modern Hospital Queue & Appointment Management
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Streamline your hospital operations with our intelligent queue
            management and appointment booking system.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/track-token">
              <Button size="lg" variant="outline">
                Track Token
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Clock className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>Queue Management</CardTitle>
              <CardDescription>
                Generate tokens and track your position in real-time. No more
                waiting in crowded rooms.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>Appointment Booking</CardTitle>
              <CardDescription>
                Book appointments with doctors online. Choose your preferred
                time slot.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>For Everyone</CardTitle>
              <CardDescription>
                Works for patients, doctors, and staff. Complete management
                solution.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>


      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of hospitals using our platform
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Start Free Trial
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>


      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 HospitalMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
