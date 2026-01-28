import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Sparkles,
  Users,
  LayoutDashboard,
  Zap,
  Lock,
  Twitter,
  Github,
  Linkedin,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const features = [
  {
    title: "Queue Intelligence",
    description: "Live pacing and auto-prioritization to keep patient flows steady and predictable.",
    icon: Clock,
  },
  {
    title: "Booking Clarity",
    description: "A seamless, high-fidelity confirmation flow for every client, reducing no-shows.",
    icon: Calendar,
  },
  {
    title: "Multi-role Control",
    description: "Purpose-built interfaces for owners, staff, and customers to ensure harmony.",
    icon: Users,
  },
  {
    title: "Instant Analytics",
    description: "Real-time data on wait times and staff performance at a single glance.",
    icon: LayoutDashboard,
  },
  {
    title: "Priority Routing",
    description: "Automatically shift resources based on urgent patient needs and clinic load.",
    icon: Zap,
  },
  {
    title: "HIPAA Compliant",
    description: "Enterprise-grade security ensuring all patient data is encrypted and protected.",
    icon: Lock,
  },
];

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? (await supabase.from("profiles").select("role").eq("id", user.id).single()).data
    : null;

  const dashboardUrl = profile?.role ? `/${profile.role}` : "/dashboard";
  const isAuthenticated = Boolean(user);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/10">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground overflow-hidden">
              <Image src="/logo.png" alt="QControl logo" width={20} height={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">QControl</span>
          </div>
          
          <div className="flex items-center gap-4">
            <ModeToggle />
            {!isAuthenticated && (
              <Link href="/login" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Sign in
              </Link>
            )}
            <Link href={isAuthenticated ? dashboardUrl : "/register"}>
              <Button className="flex items-center gap-2">
                {isAuthenticated ? "Dashboard" : "Get Started"}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        
        <section className="relative w-full overflow-hidden border-b">
          <div
            className="absolute inset-0 z-0 opacity-20"
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

          <div className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-32 flex flex-col items-center text-center">
            <div className="mb-6 flex items-center gap-2 border bg-background/50 px-3 py-1 rounded-sm backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Manage your queue effortlessly</span>
            </div>

            <h1 className="max-w-4xl text-5xl font-medium leading-[1.1] tracking-tight sm:text-7xl">
              Precision Queue Management <br />
              <span className="text-muted-foreground font-light italic font-serif">for High-Stakes Teams.</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg text-muted-foreground">
              Stop guessing wait times. QControl synchronizes your arrivals and appointments into a single, high-performance flow.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
              <Link href={isAuthenticated ? dashboardUrl : "/register"}>
                <Button size="lg" className="px-10">
                  {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
                </Button>
              </Link>
              <Link href="/track-token">
                <Button variant="outline" size="lg" className="px-10">
                  Track a token
                </Button>
              </Link>
            </div>
          </div>
        </section>

        
        <section className="py-20 bg-muted/30">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-sm border bg-card p-2 shadow-2xl">
              <div className="rounded-sm bg-muted overflow-hidden">
                <Image
                  src="/hero-black.png"
                  alt="Interface Preview"
                  width={1400}
                  height={800}
                  className="w-full grayscale-[0.1] hover:grayscale-0 transition-all duration-1000"
                />
              </div>
            </div>
          </div>
        </section>

      
        <section className="py-32 mx-auto max-w-7xl px-6">
          <div className="mb-16 border-l-4 border-primary pl-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-2">Capabilities</h2>
            <h3 className="text-3xl font-medium tracking-tight">Engineered for reliability.</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border overflow-hidden rounded-sm">
            {features.map((item) => (
              <div key={item.title} className="bg-card p-12 transition-colors hover:bg-muted/50 group">
                <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-sm bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <item.icon className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest">{item.title}</h4>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 mb-32">
          <div className="rounded-sm bg-primary px-8 py-20 text-center text-primary-foreground relative overflow-hidden">
            <h2 className="text-3xl font-light sm:text-4xl tracking-tight">
              Ready to transform your <span className="italic font-serif">daily rhythm?</span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button variant="secondary" size="lg" className="px-8">
                  Get Started Now
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background pt-24 pb-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-12 mb-20">
            <div className="col-span-2 md:col-span-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-primary-foreground overflow-hidden">
                  <Image src="/logo.png" alt="QControl logo" width={16} height={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">QControl</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Next-generation operational software for medical facilities and professional service centers.
              </p>
            </div>
            
            <div className="col-span-1 md:col-span-2 md:col-start-7">
              <h5 className="text-[10px] font-bold uppercase tracking-widest mb-6">Product</h5>
              <ul className="space-y-4 text-[13px] text-muted-foreground font-medium">
                <li><Link href="#" className="hover:text-foreground transition-colors">Queue System</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Appointments</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Analytics</Link></li>
              </ul>
            </div>

            <div className="col-span-1 md:col-span-2">
              <h5 className="text-[10px] font-bold uppercase tracking-widest mb-6">Company</h5>
              <ul className="space-y-4 text-[13px] text-muted-foreground font-medium">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Support</Link></li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-2">
              <h5 className="text-[10px] font-bold uppercase tracking-widest mb-6">Social</h5>
              <div className="flex gap-5">
                <Twitter className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                <Github className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                <Linkedin className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
              </div>
            </div>
          </div>
          
          <div className="border-t pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              © 2026 QControl — BEYOND WAITING.
            </span>
            <div className="flex items-center gap-2 border px-3 py-1 rounded-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Service Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}