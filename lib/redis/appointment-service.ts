import { getRedisClient, RedisKeys, CacheTTL } from "./client";
import { Appointment, AppointmentStats } from "@/lib/types";

export interface CachedAppointmentStats extends AppointmentStats {
  lastUpdated: string;
}

export class AppointmentRedisService {
  private redis = getRedisClient();

  async getAppointment(appointmentId: string): Promise<Appointment | null> {
    const key = RedisKeys.appointmentData(appointmentId);
    return await this.redis.get<Appointment>(key);
  }

   
  async setAppointment(appointment: Appointment): Promise<void> {
    const key = RedisKeys.appointmentData(appointment.id);
    await this.redis.set(key, appointment, { ex: CacheTTL.APPOINTMENT_DATA });
  }

 
  async invalidateAppointment(appointmentId: string): Promise<void> {
    const key = RedisKeys.appointmentData(appointmentId);
    await this.redis.del(key);
  }

   
  async getDoctorAppointments(doctorId: string, date: string): Promise<Appointment[] | null> {
    const key = RedisKeys.doctorAppointments(doctorId, date);
    return await this.redis.get<Appointment[]>(key);
  }

  
  async setDoctorAppointments(doctorId: string, date: string, appointments: Appointment[]): Promise<void> {
    const key = RedisKeys.doctorAppointments(doctorId, date);
    await this.redis.set(key, appointments, { ex: CacheTTL.DOCTOR_APPOINTMENTS });
  }

   
  async invalidateDoctorAppointments(doctorId: string, date: string): Promise<void> {
    const key = RedisKeys.doctorAppointments(doctorId, date);
    await this.redis.del(key);
  }

  async getPendingCount(doctorId: string): Promise<number | null> {
    const key = `doctor:${doctorId}:pending_count`;
    return await this.redis.get<number>(key);
  }

  async setPendingCount(doctorId: string, count: number): Promise<void> {
    const key = `doctor:${doctorId}:pending_count`;
    await this.redis.set(key, count, { ex: 300 }); 
  }

  async incrementPendingCount(doctorId: string): Promise<number> {
    const key = `doctor:${doctorId}:pending_count`;
    return await this.redis.incr(key);
  }

  async decrementPendingCount(doctorId: string): Promise<number> {
    const key = `doctor:${doctorId}:pending_count`;
    const newCount = await this.redis.decr(key);
    return Math.max(0, newCount);
  }

  async publishAppointmentUpdate(
    appointmentId: string, 
    event: string, 
    data: Record<string, unknown>
  ): Promise<void> {
    const channel = `appointment:${appointmentId}:updates`;
    await this.redis.publish(channel, JSON.stringify({ event, data, timestamp: Date.now() }));
  }
}

let appointmentService: AppointmentRedisService | null = null;

export function getAppointmentRedisService(): AppointmentRedisService {
  if (!appointmentService) {
    appointmentService = new AppointmentRedisService();
  }
  return appointmentService;
}

