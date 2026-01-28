import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

let getQueueRedisService: (() => {
  incrementWaitingCount: (id: string) => Promise<number>;
  invalidateQueueStats: (id: string) => Promise<void>;
  setTokenData: (token: unknown) => Promise<void>;
  acquireLock: (id: string, ttl?: number) => Promise<boolean>;
  releaseLock: (id: string) => Promise<void>;
}) | null = null;

try {
  const redis = require("@/lib/redis/queue-service");
  getQueueRedisService = redis.getQueueRedisService;
} catch {
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const supabase = createAdminSupabaseClient();
    const body = await request.json();

    const {
      queue_id,
      business_id,
      patient_name,
      patient_phone,
      patient_age,
      purpose,
      patient_id,
      priority = 0,
    } = body;

    if (!queue_id || !business_id || !patient_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: queue } = await supabase
      .from("queues")
      .select("*")
      .eq("id", queue_id)
      .single();

    if (!queue || !queue.is_active) {
      return NextResponse.json(
        { error: "Queue is not available" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("queue_tokens")
      .select("*", { count: "exact", head: true })
      .eq("queue_id", queue_id)
      .gte("created_at", today);

    if (count && count >= queue.max_tokens_per_day) {
      return NextResponse.json(
        { error: "Queue has reached maximum capacity for today" },
        { status: 400 }
      );
    }

    let redisService = null;
    let lockAcquired = false;
    
    if (getQueueRedisService) {
      try {
        redisService = getQueueRedisService();
        lockAcquired = await redisService.acquireLock(queue_id, 5);
      } catch (redisError) {
        console.warn("Redis lock error:", redisError);
      }
    }

    try {
      const { data: tokenNumber, error: rpcError } = await supabase.rpc(
        "get_next_queue_token_number",
        { p_queue_id: queue_id }
      );

      if (rpcError) {
        console.error("RPC Error:", rpcError);
        return NextResponse.json(
          { error: "Failed to generate token number" },
          { status: 500 }
        );
      }

      const { data: token, error: insertError } = await supabase
        .from("queue_tokens")
        .insert({
          queue_id,
          business_id,
          token_number: tokenNumber,
          patient_id,
          patient_name,
          patient_phone,
          patient_age,
          purpose,
          priority,
          status: "waiting",
        })
        .select("*, queues(name, estimated_wait_time), businesses(name)")
        .single();

      if (insertError) {
        console.error("Insert Error:", insertError);
        return NextResponse.json(
          { error: "Failed to create token" },
          { status: 500 }
        );
      }

      if (redisService) {
        try {
          await Promise.all([
            redisService.incrementWaitingCount(queue_id),
            redisService.setTokenData(token),
            redisService.invalidateQueueStats(queue_id),
          ]);
        } catch (cacheError) {
          console.warn("Redis cache update error:", cacheError);
        }
      }

      const processingTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        token,
        message: "Token generated successfully",
        processing_time_ms: processingTime,
      });
    } finally {
      if (redisService && lockAcquired) {
        try {
          await redisService.releaseLock(queue_id);
        } catch {
        }
      }
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

