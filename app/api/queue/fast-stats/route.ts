import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";


let getQueueRedisService: (() => { getQueueStats: (id: string) => Promise<unknown>; setQueueStats: (id: string, stats: unknown) => Promise<void> }) | null = null;
try {
  const redis = require("@/lib/redis/queue-service");
  getQueueRedisService = redis.getQueueRedisService;
} catch {

}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queueId = searchParams.get("queue_id");

    if (!queueId) {
      return NextResponse.json(
        { error: "Missing queue_id parameter" },
        { status: 400 }
      );
    }


    if (getQueueRedisService) {
      try {
        const redisService = getQueueRedisService();
        const cachedStats = await redisService.getQueueStats(queueId);
        
        if (cachedStats) {
          return NextResponse.json({
            success: true,
            stats: cachedStats,
            cached: true,
          });
        }
      } catch (redisError) {
        console.warn("Redis error, falling back to Supabase:", redisError);
      }
    }


    const supabase = await createServerSupabaseClient();
    
    const { data: stats, error } = await supabase
      .rpc("get_queue_stats", { p_queue_id: queueId })
      .single();

    if (error) {
      console.error("Error fetching stats:", error);
      return NextResponse.json(
        { error: "Failed to fetch queue stats" },
        { status: 500 }
      );
    }


    if (getQueueRedisService && stats) {
      try {
        const redisService = getQueueRedisService();
        await redisService.setQueueStats(queueId, stats);
      } catch (cacheError) {
        console.warn("Failed to cache stats:", cacheError);
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      cached: false,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

