import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentBookingForm } from "@/components/forms/AppointmentBookingForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Calendar } from "lucide-react";


export default function AppointmentBookingPage() {
  return (
    <div className="min-h-screen bg-background p-4 relative">
      
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 0",
          maskImage: `
            repeating-linear-gradient(to right, black 0px, black 3px, transparent 3px, transparent 8px),
            repeating-linear-gradient(to bottom, black 0px, black 3px, transparent 3px, transparent 8px),
            radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)
          `,
          WebkitMaskImage: `
            repeating-linear-gradient(to right, black 0px, black 3px, transparent 3px, transparent 8px),
            repeating-linear-gradient(to bottom, black 0px, black 3px, transparent 3px, transparent 8px),
            radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)
          `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
         
          
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-primary-foreground group-hover:scale-105 transition-transform overflow-hidden">
              <img src="/logo.png" alt="QControl logo" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-xl font-black uppercase tracking-[0.15em]">QControl</span>
          </Link>
          
          <div className="mb-6 flex items-center justify-center gap-2 border bg-muted/50 px-3 py-1 rounded-sm backdrop-blur-sm">
            <Calendar className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Service Booking</span>
          </div>
        </div>

        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <Card className="bg-card/95 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl">Book a Service</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentBookingForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
