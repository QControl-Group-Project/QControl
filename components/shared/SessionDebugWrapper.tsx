"use client";

import { useSearchParams } from "next/navigation";
import { SessionDebug } from "@/components/shared/SessionDebug";

export function SessionDebugWrapper() {
    const searchParams = useSearchParams();
    const showSessionDebug = searchParams.get("debug") === "session";

    if (!showSessionDebug) return null;

    return (
        <div className="p-6">
            <SessionDebug />
        </div>
    );
}
