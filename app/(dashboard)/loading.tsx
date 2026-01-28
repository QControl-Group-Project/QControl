import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-[400px] rounded-xl" />
                <Skeleton className="h-[400px] rounded-xl" />
            </div>
        </div>
    );
}
