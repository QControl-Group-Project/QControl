export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "doctor" | "staff" | "patient";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  address?: string;
  gender?: "male" | "female" | "other";
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: string;
  admin_id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  website?: string;
  opening_time?: string;
  closing_time?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  hospital_id: string;
  name: string;
  description?: string;
  floor_number?: number;
  contact_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Specialization {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  profile_id: string;
  hospital_id: string;
  department_id?: string;
  specialization_id?: string;
  license_number?: string;
  qualification?: string;
  experience_years?: number;
  consultation_fee?: number;
  bio?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  specializations?: Specialization;
  hospitals?: Hospital;
  departments?: Department;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  max_patients_per_slot: number;
  is_active: boolean;
  created_at: string;
}

export interface DoctorLeave {
  id: string;
  doctor_id: string;
  leave_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  is_full_day: boolean;
  created_at: string;
}

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "waiting"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show";

export type AppointmentType =
  | "consultation"
  | "follow-up"
  | "emergency"
  | "checkup";

export interface Appointment {
  id: string;
  hospital_id: string;
  doctor_id: string;
  patient_id?: string | null;
  appointment_number: number;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_age?: number;
  patient_gender?: "male" | "female" | "other";
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  appointment_type: AppointmentType;
  symptoms?: string;
  notes?: string;
  prescription?: string;
  diagnosis?: string;
  created_at: string;
  confirmed_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  doctors?: Doctor;
  hospitals?: Hospital;
}

export interface Queue {
  id: string;
  hospital_id: string;
  department_id?: string;
  name: string;
  description?: string;
  max_tokens_per_day: number;
  estimated_wait_time: number;
  opening_time?: string;
  closing_time?: string;
  is_active: boolean;
  qr_code_url?: string;
  current_token_number: number;
  created_at: string;
  hospitals?: Hospital;
  departments?: Department;
}

export type QueueTokenStatus =
  | "waiting"
  | "called"
  | "serving"
  | "served"
  | "skipped"
  | "cancelled";

export interface QueueToken {
  id: string;
  queue_id: string;
  hospital_id: string;
  token_number: number;
  patient_id?: string | null;
  patient_name: string;
  patient_phone?: string;
  patient_age?: number;
  purpose?: string;
  priority: number;
  status: QueueTokenStatus;
  created_at: string;
  called_at?: string;
  serving_started_at?: string;
  completed_at?: string;
  queues?: Queue;
  hospitals?: Hospital;
}

export interface StaffAssignment {
  id: string;
  staff_id: string;
  hospital_id: string;
  department_id?: string;
  assigned_by?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  hospitals?: Hospital;
}

export interface QueueStaffAssignment {
  id: string;
  staff_id: string;
  queue_id: string;
  hospital_id: string;
  assigned_by?: string;
  is_active: boolean;
  created_at: string;
  queues?: Queue;
}

export type InvitationStatus = "pending" | "accepted" | "expired";

export interface Invitation {
  id: string;
  hospital_id: string;
  email: string;
  role: UserRole;
  invited_by?: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  metadata?: Json;
  created_at: string;
}

export interface QueueStats {
  waiting: number;
  called: number;
  serving: number;
  served: number;
  skipped: number;
  cancelled: number;
  average_wait_time: number;
  total: number;
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  waiting: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  no_show: number;
}
