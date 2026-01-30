"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";
import { usePatientData } from "@/lib/hooks/use-patient-data";
import { usePatientNotifications } from "@/lib/hooks/useRoleNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Clock, Ticket, Plus, User, MapPin, ArrowRight, Activity } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientDashboard() {
  const { profile } = useAuth();
  const { data, isLoading } = usePatientData();
  
  usePatientNotifications();

  const loading = isLoading;
  const upcomingAppointments = data?.upcomingAppointments || [];
  const activeTokens = data?.activeTokens || [];
  const stats = data?.stats || {
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    activeTokens: 0,
  };

  return (
    <div className="min-h-screen bg-background p-3 md:p-4 lg:p-6 transition-colors duration-300">
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Customer Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              {profile ? (
                `Welcome back, ${profile.full_name}`
              ) : (
                <Skeleton className="h-5 w-48 inline-block" />
              )}
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/appointments">
              <Button className="w-full sm:w-auto gap-2 shadow-sm">
                <Calendar className="h-4 w-4" />
                Book a Service
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link href="/queue/select">
              <Button variant="outline" className="w-full sm:w-auto gap-2 border-primary/50 hover:bg-primary/10">
                <Ticket className="h-4 w-4" />
                Get Queue Token
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { 
              title: "Total Bookings", 
              value: stats.totalAppointments, 
              icon: Calendar,
              color: "text-blue-500",
              bgColor: "bg-blue-500/10"
            },
            { 
              title: "Upcoming", 
              value: stats.upcomingAppointments, 
              icon: Clock,
              color: "text-amber-500",
              bgColor: "bg-amber-500/10"
            },
            { 
              title: "Completed", 
              value: stats.completedAppointments, 
              icon: Activity,
              color: "text-emerald-500",
              bgColor: "bg-emerald-500/10"
            },
            { 
              title: "Active Tokens", 
              value: stats.activeTokens, 
              icon: Ticket,
              color: "text-purple-500",
              bgColor: "bg-purple-500/10"
            }
          ].map((item, i) => (
            <Card key={i} className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${item.bgColor}`}>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  {loading ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    <span className="text-xl font-bold text-foreground">{item.value}</span>
                  )}
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-2">{item.title}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {i === 0 ? "All time" : i === 1 ? "Scheduled" : i === 2 ? "Finished" : "In queue"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          
          {/* Active Queue Tokens Section */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="p-4 pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">Active Queue Tokens</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Current queue positions</p>
                </div>
                <Link href="/customer/tokens">
                  <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground">
                    View All
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : activeTokens.length > 0 ? (
                <div className="divide-y divide-border">
                  {activeTokens.map((token) => (
                    <div key={token.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Token Number */}
                          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-blue-500/10 border border-blue-500/20 flex-shrink-0">
                            <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                              {token.token_number || "#"}
                            </span>
                            <Badge variant="outline" className="mt-0.5 text-[10px] uppercase px-1 py-0 h-4 bg-background">
                              {token.status}
                            </Badge>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground text-sm truncate">
                              {token.businesses?.name ?? "Business"}
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium truncate">
                              {token.queues?.name ?? "Queue"}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                              <span className="truncate">Est. wait: {token.queues?.estimated_wait_time ?? 0}min</span>
                            </div>
                          </div>
                        </div>

                        <Link href={`/track-token/${token.id}`}>
                          <Button size="sm" className="h-8">Track</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Ticket} title="No active tokens" desc="Join a queue to get started" />
              )}
            </CardContent>
          </Card>

          {/* Upcoming Bookings Section */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="p-4 pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">Upcoming Bookings</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Scheduled appointments</p>
                </div>
                <Link href="/customer/appointments">
                  <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              ) : upcomingAppointments.length > 0 ? (
                <div className="divide-y divide-border">
                  {upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded font-bold text-xs flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(apt.appointment_date), "MMM dd, yyyy")}
                            </div>
                            <div className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {apt.appointment_time.substring(0, 5)}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-sm">
                              <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="font-semibold text-foreground truncate">
                                {apt.doctors?.profiles?.full_name ?? "Not set"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
                              <span className="truncate">{apt.businesses?.name ?? "Business"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                          <Badge 
                            variant={apt.status === "confirmed" ? "default" : "secondary"}
                            className={apt.status === "confirmed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
                          >
                            {apt.status}
                          </Badge>
                          <Link href={`/customer/appointments/${apt.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs">Details</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Calendar} title="No upcoming bookings" desc="Schedule your first visit" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-foreground font-medium text-sm mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-3">{desc}</p>
    </div>
  );
}