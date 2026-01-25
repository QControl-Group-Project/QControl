"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseAuth } from "@/lib/hooks/use-auth";
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
  Hospital,
  Stethoscope,
  UserCog,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { SessionDebug } from "@/components/shared/SessionDebug";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading, profileLoading, supabase } = useSupabaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const showSessionDebug = searchParams.get("debug") === "session";

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading || (user && profileLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            We could not load your profile. Please sign in again.
          </p>
          <Button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
          >
            Go to login
          </Button>
        </div>
      </div>
    );
  }

  const getNavItems = () => {
    const baseUrl = `/${profile.role}`;

    switch (profile.role) {
      case "admin":
        return [
          { icon: LayoutDashboard, label: "Dashboard", href: `${baseUrl}` },
          {
            icon: Hospital,
            label: "Hospital Settings",
            href: `${baseUrl}/hospital`,
          },
          { icon: Users, label: "Manage Doctors", href: `${baseUrl}/doctors` },
          { icon: UserCog, label: "Manage Staff", href: `${baseUrl}/staff` },
          { icon: ClipboardList, label: "Queues", href: `${baseUrl}/queues` },
          {
            icon: Calendar,
            label: "Appointments",
            href: `${baseUrl}/appointments`,
          },
          { icon: Settings, label: "Settings", href: `${baseUrl}/settings` },
        ];
      case "doctor":
        return [
          { icon: LayoutDashboard, label: "Dashboard", href: `${baseUrl}` },
          {
            icon: Calendar,
            label: "My Appointments",
            href: `${baseUrl}/appointments`,
          },
          {
            icon: ClipboardList,
            label: "My Schedule",
            href: `${baseUrl}/schedule`,
          },
          { icon: Users, label: "Patients", href: `${baseUrl}/patients` },
          { icon: Settings, label: "Settings", href: `${baseUrl}/settings` },
        ];
      case "staff":
        return [
          { icon: LayoutDashboard, label: "Dashboard", href: `${baseUrl}` },
          {
            icon: ClipboardList,
            label: "Manage Queue",
            href: `${baseUrl}/queue`,
          },
          {
            icon: Calendar,
            label: "Appointments",
            href: `${baseUrl}/appointments`,
          },
          { icon: Users, label: "Patients", href: `${baseUrl}/patients` },
        ];
      case "patient":
        return [
          { icon: LayoutDashboard, label: "Dashboard", href: `${baseUrl}` },
          {
            icon: Calendar,
            label: "My Appointments",
            href: `${baseUrl}/appointments`,
          },
          {
            icon: ClipboardList,
            label: "My Tokens",
            href: `${baseUrl}/tokens`,
          },
          { icon: Settings, label: "Profile", href: `${baseUrl}/profile` },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const roleLabel = profile.role === "admin" ? "Hospital" : profile.role;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-blue-600">HospitalMS</h1>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <item.icon className="h-5 w-5" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <div className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>
                      {profile.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {sidebarOpen && (
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">
                        {profile.full_name}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {roleLabel}
                      </span>
                    </div>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    router.push(
                      profile.role === "patient"
                        ? "/patient/profile"
                        : `/${profile.role}/settings`
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {showSessionDebug && (
          <div className="p-6">
            <SessionDebug />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
