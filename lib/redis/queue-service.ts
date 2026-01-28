import { getRedisClient, RedisKeys, CacheTTL } from "./client";
import { QueueStats, QueueToken, Queue } from "@/lib/types";

export interface CachedQueueStats extends QueueStats {
  lastUpdated: string;
}

export class QueueRedisService {
  private redis = getRedisClient();

  
  async getQueueStats(queueId: string): Promise<CachedQueueStats | null> {
    const key = RedisKeys.queueStats(queueId);
    const cached = await this.redis.get<CachedQueueStats>(key);
    return cached;
  }

  
  async setQueueStats(queueId: string, stats: QueueStats): Promise<void> {
    const key = RedisKeys.queueStats(queueId);
    const cachedStats: CachedQueueStats = {
      ...stats,
      lastUpdated: new Date().toISOString(),
    };
    await this.redis.set(key, cachedStats, { ex: CacheTTL.QUEUE_STATS });
  }

  
  async invalidateQueueStats(queueId: string): Promise<void> {
    const key = RedisKeys.queueStats(queueId);
    await this.redis.del(key);
  }

 
  async getCurrentToken(queueId: string): Promise<number | null> {
    const key = RedisKeys.queueCurrentToken(queueId);
    return await this.redis.get<number>(key);
  }

   
  async setCurrentToken(queueId: string, tokenNumber: number): Promise<void> {
    const key = RedisKeys.queueCurrentToken(queueId);
    await this.redis.set(key, tokenNumber, { ex: CacheTTL.QUEUE_TOKENS });
  }

 
  async getWaitingCount(queueId: string): Promise<number | null> {
    const key = RedisKeys.queueWaitingCount(queueId);
    return await this.redis.get<number>(key);
  }


  async incrementWaitingCount(queueId: string): Promise<number> {
    const key = RedisKeys.queueWaitingCount(queueId);
    const newCount = await this.redis.incr(key);
    await this.redis.expire(key, 86400); 
    return newCount;
  }

 
  async decrementWaitingCount(queueId: string): Promise<number> {
    const key = RedisKeys.queueWaitingCount(queueId);
    const newCount = await this.redis.decr(key);
    return Math.max(0, newCount);
  }

 
  async setWaitingCount(queueId: string, count: number): Promise<void> {
    const key = RedisKeys.queueWaitingCount(queueId);
    await this.redis.set(key, count, { ex: 86400 });
  }

 
  async getTokenData(tokenId: string): Promise<QueueToken | null> {
    const key = RedisKeys.tokenData(tokenId);
    return await this.redis.get<QueueToken>(key);
  }

  async setTokenData(token: QueueToken): Promise<void> {
    const key = RedisKeys.tokenData(token.id);
    await this.redis.set(key, token, { ex: CacheTTL.TOKEN_DATA });
  }


  async invalidateToken(tokenId: string): Promise<void> {
    const key = RedisKeys.tokenData(tokenId);
    await this.redis.del(key);
  }


  async getTokenPosition(queueId: string, tokenId: string): Promise<number | null> {
    const key = RedisKeys.tokenPosition(queueId, tokenId);
    return await this.redis.get<number>(key);
  }

  
  async setTokenPosition(queueId: string, tokenId: string, position: number): Promise<void> {
    const key = RedisKeys.tokenPosition(queueId, tokenId);
    await this.redis.set(key, position, { ex: CacheTTL.QUEUE_TOKENS });
  }

  
  async acquireLock(queueId: string, ttlSeconds: number = 5): Promise<boolean> {
    const key = RedisKeys.queueLock(queueId);
    const result = await this.redis.set(key, "locked", { nx: true, ex: ttlSeconds });
    return result === "OK";
  }

  
  async releaseLock(queueId: string): Promise<void> {
    const key = RedisKeys.queueLock(queueId);
    await this.redis.del(key);
  }

  
  async setBusinessActiveQueues(businessId: string, queues: Queue[]): Promise<void> {
    const key = RedisKeys.businessActiveQueues(businessId);
    await this.redis.set(key, queues, { ex: CacheTTL.BUSINESS_QUEUES });
  }

  
  async getBusinessActiveQueues(businessId: string): Promise<Queue[] | null> {
    const key = RedisKeys.businessActiveQueues(businessId);
    return await this.redis.get<Queue[]>(key);
  }

 
  async invalidateBusinessQueues(businessId: string): Promise<void> {
    const key = RedisKeys.businessActiveQueues(businessId);
    await this.redis.del(key);
  }

  
  async batchUpdateQueueStats(updates: Array<{ queueId: string; stats: QueueStats }>): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const { queueId, stats } of updates) {
      const key = RedisKeys.queueStats(queueId);
      const cachedStats: CachedQueueStats = {
        ...stats,
        lastUpdated: new Date().toISOString(),
      };
      pipeline.set(key, JSON.stringify(cachedStats), { ex: CacheTTL.QUEUE_STATS });
    }
    
    await pipeline.exec();
  }

   
  async getEstimatedWaitTime(queueId: string, avgServiceTimeMinutes: number = 5): Promise<number> {
    const waitingCount = await this.getWaitingCount(queueId);
    if (waitingCount === null) return 0;
    return waitingCount * avgServiceTimeMinutes;
  }


  async publishQueueUpdate(queueId: string, event: string, data: Record<string, unknown>): Promise<void> {
    const channel = `queue:${queueId}:updates`;
    await this.redis.publish(channel, JSON.stringify({ event, data, timestamp: Date.now() }));
  }
}

let queueService: QueueRedisService | null = null;

export function getQueueRedisService(): QueueRedisService {
  if (!queueService) {
    queueService = new QueueRedisService();
  }
  return queueService;
}

