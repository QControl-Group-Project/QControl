import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variables"
      );
    }

    redis = new Redis({
      url,
      token,
    });
  }

  return redis;
}

export const RedisKeys = {
  queueStats: (queueId: string) => `queue:${queueId}:stats`,
  queueCurrentToken: (queueId: string) => `queue:${queueId}:current`,
  queueWaitingCount: (queueId: string) => `queue:${queueId}:waiting`,
  queueTokens: (queueId: string, date: string) => `queue:${queueId}:tokens:${date}`,
  queueLock: (queueId: string) => `queue:${queueId}:lock`,
  
  tokenData: (tokenId: string) => `token:${tokenId}`,
  tokenPosition: (queueId: string, tokenId: string) => `queue:${queueId}:position:${tokenId}`,
  
  appointmentData: (appointmentId: string) => `appointment:${appointmentId}`,
  doctorAppointments: (doctorId: string, date: string) => `doctor:${doctorId}:appointments:${date}`,
  
  businessQueues: (businessId: string) => `business:${businessId}:queues`,
  businessActiveQueues: (businessId: string) => `business:${businessId}:active_queues`,
};

export const CacheTTL = {
  QUEUE_STATS: 30,           
  TOKEN_DATA: 300,           
  QUEUE_TOKENS: 60,          
  APPOINTMENT_DATA: 300,     
  DOCTOR_APPOINTMENTS: 120,  
  BUSINESS_QUEUES: 180,      
};

