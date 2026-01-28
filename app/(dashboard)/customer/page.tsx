"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";
import { usePatientData } from "@/lib/hooks/use-patient-data";
import { usePatientNotifications } from "@/lib/hooks/useRoleNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Clock, Ticket, Plus, User, MapPin } from "lucide-react";
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customer Dashboard</h1>
        <p className="text-gray-500">
          {profile ? `Welcome back, ${profile.full_name}` : <Skeleton className="h-4 w-48 inline-block" />}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/appointments">
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="font-semibold text-lg mb-1">Book a Service</h3>
                <p className="text-sm text-gray-500">
                  Schedule a visit with a provider
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/queue/select">
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="font-semibold text-lg mb-1">Get Queue Token</h3>
                <p className="text-sm text-gray-500">Join a queue</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Ticket className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Total Bookings", value: stats.totalAppointments, icon: Calendar },
          { title: "Upcoming", value: stats.upcomingAppointments, icon: Clock },
          { title: "Completed", value: stats.completedAppointments, icon: Calendar },
          { title: "Active Tokens", value: stats.activeTokens, icon: Ticket }
        ].map((item, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {item.title}
              </CardTitle>
              <item.icon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{item.value}</div>
              )}
              <p className="text-xs text-gray-500">
                {i === 0 ? "All time" : i === 1 ? "Scheduled" : i === 2 ? "Total completed" : "In queue"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          </CardContent>
        </Card>
      ) : activeTokens.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Queue Tokens</CardTitle>
            <Link href="/customer/tokens">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
  <div className="space-y-3">
    {activeTokens.map((token) => (
      <Card
        key={token.id}
        className="group relative overflow-hidden border-muted bg-card hover:bg-accent/5 transition-all duration-200"
      >
        
        <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
        
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
             
              <div className="flex flex-col items-center justify-center min-w-[60px] h-16 rounded-lg bg-muted/50 dark:bg-muted/20 border border-border">
                <span className="text-2xl font-black text-foreground leading-none">
                 
                  {token.token_number || "#"}
                </span>
                <Badge
                  variant={
                    token.status === "waiting"
                      ? "secondary"
                      : token.status === "called"
                        ? "default"
                        : "destructive"
                  }
                  className="mt-1 h-4 text-[10px] uppercase px-1.5"
                >
                  {token.status}
                </Badge>
              </div>

            
              <div className="space-y-0.5">
                <h3 className="font-bold text-foreground leading-none">
                  {token.businesses?.name ?? "Business"}
                </h3>
                <p className="text-sm font-medium text-muted-foreground">
                  {token.queues?.name ?? "Queue"}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Est. wait: {token.queues?.estimated_wait_time ?? 0}min / person</span>
                </div>
              </div>
            </div>

          
            <Link href={`/track-token/${token.id}`}>
              <Button 
                size="sm" 
                variant="outline" 
                className="shadow-sm hover:bg-primary hover:text-primary-foreground"
              >
                Track
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
</CardContent>
        </Card>
      )}

     
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Bookings</CardTitle>
          <Link href="/customer/appointments">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No upcoming bookings</p>
              <Link href="/appointments">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Book Your First Service
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <Card
                  key={apt.id}
                  className="border hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded font-semibold text-sm">
                            {format(
                              new Date(apt.appointment_date),
                              "MMM dd, yyyy"
                            )}
                          </div>
                          <div className="bg-gray-100 px-3 py-1 rounded text-sm font-medium">
                            {apt.appointment_time.substring(0, 5)}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold">
                              {apt.doctors?.profiles?.full_name ?? "Not set"}
                            </span>
                            <span className="text-sm text-gray-500">
                              • {apt.doctors?.specializations?.name ?? "Specialty"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{apt.businesses?.name ?? "Business"}</span>
                          </div>

                          {apt.symptoms && (
                            <p className="text-sm text-gray-600 mt-2">
                              Reason: {apt.symptoms}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 items-end">
                        <Badge
                          variant={
                            apt.status === "confirmed" ? "default" : "secondary"
                          }
                        >
                          {apt.status}
                        </Badge>
                        <Link href={`/customer/appointments/${apt.id}`}>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
