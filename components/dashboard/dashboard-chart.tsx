"use client"

import { useQuery } from "@tanstack/react-query"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/hooks/use-auth"
import { useAdminNotifications } from "@/lib/hooks/useRoleNotifications"
import { format, subDays } from "date-fns"
import { createClient } from "@/lib/supabase/client"

interface ChartData {
    name: string
    appointments: number
    tokens: number
    date: string
}

async function fetchChartAnalytics(profileId: string) {
    const supabase = createClient()
    
    const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("admin_id", profileId)
        .single()

    if (businessError || !businessData) {
        const endDate = new Date()
        const chartData: ChartData[] = []
        for (let i = 6; i >= 0; i--) {
            const currentDate = subDays(endDate, i)
            chartData.push({
                name: format(currentDate, 'EEE'),
                appointments: 0,
                tokens: 0,
                date: currentDate.toISOString().split('T')[0]
            })
        }
        return { chartData, businessId: "" }
    }

    const endDate = new Date()
    const startDate = subDays(endDate, 6)
    const startDateStart = new Date(startDate)
    startDateStart.setHours(0, 0, 0, 0)
    const endDateEnd = new Date(endDate)
    endDateEnd.setHours(23, 59, 59, 999)
    const startDateStr = startDateStart.toISOString()
    const endDateStr = endDateEnd.toISOString()
    const startDateDateStr = startDateStart.toISOString().split('T')[0]
    const endDateDateStr = endDateEnd.toISOString().split('T')[0]

    const [tokensResult, appointmentsResult] = await Promise.all([
        supabase
            .from("queue_tokens")
            .select("created_at")
            .eq("business_id", businessData.id)
            .gte("created_at", startDateStr)
            .lte("created_at", endDateStr),
        supabase
            .from("appointments")
            .select("appointment_date")
            .eq("business_id", businessData.id)
            .gte("appointment_date", startDateDateStr)
            .lte("appointment_date", endDateDateStr),
    ])

    const tokens = (tokensResult.data || []) as Array<{ created_at: string }>
    const appointments = (appointmentsResult.data || []) as Array<{
        appointment_date: string
    }>

    const tokensData = tokens.reduce<Record<string, number>>((acc, token) => {
        const date = token.created_at.split("T")[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
    }, {})
    const appointmentsData = appointments.reduce<Record<string, number>>(
        (acc, appointment) => {
            const date = appointment.appointment_date
            acc[date] = (acc[date] || 0) + 1
            return acc
        },
        {}
    )
    
    const chartData: ChartData[] = []
    for (let i = 6; i >= 0; i--) {
        const currentDate = subDays(endDate, i)
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayName = format(currentDate, 'EEE')
        
        chartData.push({
            name: dayName,
            appointments: appointmentsData[dateStr] || 0,
            tokens: tokensData[dateStr] || 0,
            date: dateStr
        })
    }

    return {
        chartData,
        businessId: businessData.id
    }
}

export function DashboardChart() {
    const { theme } = useTheme()
    const { profile } = useAuth()
    const isDark = theme === "dark"

    const { data: analyticsData, isLoading, error, refetch } = useQuery({
        queryKey: ["dashboard-chart", profile?.id],
        queryFn: () => fetchChartAnalytics(profile!.id),
        enabled: !!profile?.id,
        staleTime: 2 * 60 * 1000, 
        refetchInterval: 30 * 1000, 
        retry: 2,
    })

    useAdminNotifications(analyticsData?.businessId)

    const chartData = analyticsData?.chartData || []

    if (isLoading) {
        return (
            <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                    <CardTitle>Weekly Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <Skeleton className="h-[350px] w-full" />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        console.error('Chart data error:', error)
        return (
            <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                    <CardTitle>Weekly Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[350px] w-full flex items-center justify-center text-gray-500">
                        <p>Unable to load chart data</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Weekly Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDark ? "#1f1f1f" : "#fff",
                                    borderColor: isDark ? "#333" : "#eee",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                                }}
                                formatter={(value: number, name: string) => [
                                    value,
                                    name === 'appointments' ? 'Appointments' : 'Tokens'
                                ]}
                            />
                            <Area
                                type="monotone"
                                dataKey="appointments"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorAppointments)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="tokens"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorTokens)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}