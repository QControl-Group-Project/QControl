"use client";

import { useEffect, useMemo, useState, useCallback, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSupabaseAuth, useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Settings,
  Building2,
  UserCog,
  LogOut,
  Menu,
} from "lucide-react";
import { SessionDebugWrapper } from "@/components/shared/SessionDebugWrapper";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store/ui-store";
import { RealtimeProvider } from "@/lib/providers/realtime-provider";
import { RealtimeNotificationBell } from "@/components/notifications/realtime-notifications";
import {
  useAdminNotifications,
  useDoctorNotifications,
  usePatientNotifications,
  useStaffNotifications,
} from "@/lib/hooks/useRoleNotifications";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  icon: any;
  label: string;
  href: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading, profileLoading, supabase } = useSupabaseAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!loading && !user && !hasRedirected) {
      setHasRedirected(true);
      router.push("/login");
    }
  }, [user, loading, router, hasRedirected]);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      router.push("/");
    }
  }, [supabase, router]);

  const providerLabel = "Provider";

  const navItems = useMemo((): NavItem[] => {
    if (!profile?.role) return [];
    const baseUrl = `/${profile.role}`;

    const navMap: Record<string, NavItem[]> = {
      owner: [
        { icon: LayoutDashboard, label: "Dashboard", href: `${baseUrl}` },
        { icon: Building2, label: "Business Settings", href: `${baseUrl}/business` },
        {
          icon: Users,
          label: `Manage ${providerLabel}s`,
          href: `${baseUrl}/provider`,
        },
        { icon: UserCog, label: "Manage Staff", href: `${baseUrl}/staff` },
        { icon: ClipboardList, label: "Queues", href: `${baseUrl}/queues` },
        { icon: Calendar, label: "Bookings", href: `${baseUrl}/appointments` },
        { icon: Settings, label: "Services & Departments", href: `${baseUrl}/settings` },
      ],
      provider: [
        { icon: LayoutDashboard, label: "Dashboard", href: `${baseUrl}` },
        { icon: Calendar, label: "My Bookings", href: `${baseUrl}/appointments` },
        { icon: ClipboardList, label: "My Schedule", href: `${baseUrl}/schedule` },
        { icon: Users, label: "Customers", href: `${baseUrl}/patients` },
        { icon: Settings, label: "Settings", href: `${baseUrl}/settings` },
      ],
      staff: [
        { icon: LayoutDashboard, label: "Dashboard", href: `${baseUrl}` },
        { icon: ClipboardList, label: "Manage Queue", href: `${baseUrl}/queue` },
        { icon: Calendar, label: "Bookings", href: `${baseUrl}/appointments` },
        { icon: Users, label: "Customers", href: `${baseUrl}/patients` },
      ],
      customer: [
        { icon: LayoutDashboard, label: "Dashboard", href: `${baseUrl}` },
        { icon: Calendar, label: "My Bookings", href: `${baseUrl}/appointments` },
        { icon: ClipboardList, label: "My Tokens", href: `${baseUrl}/tokens` },
        { icon: Settings, label: "Profile", href: `${baseUrl}/profile` },
      ],
    };

    return navMap[profile.role] || [];
  }, [profile?.role, providerLabel]);

  const isActiveRoute = useCallback(
    (href: string) => {
      if (href === `/${profile?.role}`) {
        return pathname === href;
      }
      return pathname?.startsWith(href);
    },
    [pathname, profile?.role]
  );

  const roleLabel = useMemo(() => {
    if (!profile?.role) return "User";
    if (profile.role === "owner") return "Business Owner";
    if (profile.role === "provider") return providerLabel;
    if (profile.role === "customer") return "Customer";
    return "Staff";
  }, [profile?.role, providerLabel]);

  if (!loading && !user) return null;

  if (!loading && !profile && !profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            We could not load your profile. Please sign in again.
          </p>
          <Button onClick={handleLogout}>Go to login</Button>
        </div>
      </div>
    );
  }

  return (
    <RealtimeProvider
      enablePresence={true}
      enableBroadcast={true}
      enableNotifications={true}
    >
      <NotificationBridge />
      <div className="flex min-h-screen bg-background">
        <aside
          className={cn(
            "bg-card/95 border-r transition-all duration-300 flex-shrink-0 flex flex-col shadow-[0_20px_60px_-50px_rgba(10,20,30,0.6)] backdrop-blur-xl fixed inset-y-0 left-0 md:relative md:translate-x-0 z-40",
            sidebarOpen ? "w-64" : "w-20 md:w-20",
            !sidebarOpen && "-translate-x-full md:translate-x-0"
          )}
        >
          <div className="flex items-center justify-between p-6 h-16 border-b">
            {sidebarOpen && (
              <Link
                href="/"
                className={cn(
                  "items-center gap-3",
                  sidebarOpen ? "flex" : "hidden",
                  "lg:flex"
                )}
                aria-label="Go to home"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground overflow-hidden">
                  <img src="/logo.png" alt="QControl logo" className="h-5 w-5 object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
                    QCONTROL
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    Control Console
                  </span>
                </div>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={sidebarOpen}
              className={cn(
                "hover:bg-muted",
                sidebarOpen ? "inline-flex md:inline-flex" : "hidden md:inline-flex"
              )}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto" role="navigation">
            {navItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden md:ml-0">
          <header className="h-16 border-b bg-background/95 backdrop-blur-md flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className={cn("md:hidden", sidebarOpen && "hidden")}
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block">
                <ModeToggle />
              </div>

              <RealtimeNotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger
                  className="outline-none flex items-center gap-2 sm:gap-3 cursor-pointer group"
                  aria-label="User menu"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{roleLabel}</p>
                  </div>
                  <Avatar className="h-9 w-9 ring-2 ring-border group-hover:ring-primary transition-all">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile?.full_name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(
                          profile?.role === "customer"
                            ? "/customer/profile"
                            : `/${profile?.role ?? "customer"}/settings`
                        )
                      }
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto pt-16 md:pt-0">
            <Suspense fallback={null}>
              <SessionDebugWrapper />
            </Suspense>
            {children}
          </div>
        </main>
      </div>
    </RealtimeProvider>
  );
}

function NotificationBridge() {
  const { profile } = useAuth();

  if (!profile?.role) return null;

  switch (profile.role) {
    case "customer":
      return <CustomerNotifications />;
    case "provider":
      return <ProviderNotifications />;
    case "staff":
      return <StaffNotifications />;
    case "owner":
      return <OwnerNotifications />;
    default:
      return null;
  }
}

function CustomerNotifications() {
  usePatientNotifications();
  return null;
}

function ProviderNotifications() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [doctorId, setDoctorId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadDoctor = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from("doctors")
        .select("id")
        .eq("profile_id", profile.id)
        .single();
      setDoctorId(data?.id);
    };
    loadDoctor();
  }, [profile?.id, supabase]);

  useDoctorNotifications(doctorId);
  return null;
}

function StaffNotifications() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [businessId, setBusinessId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadBusiness = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from("staff_assignments")
        .select("business_id")
        .eq("staff_id", profile.id)
        .eq("is_active", true)
        .limit(1)
        .single();
      setBusinessId(data?.business_id);
    };
    loadBusiness();
  }, [profile?.id, supabase]);

  useStaffNotifications(businessId);
  return null;
}

function OwnerNotifications() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [businessId, setBusinessId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadBusiness = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from("businesses")
        .select("id")
        .eq("admin_id", profile.id)
        .single();
      setBusinessId(data?.id);
    };
    loadBusiness();
  }, [profile?.id, supabase]);

  useAdminNotifications(businessId);
  return null;
}