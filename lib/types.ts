export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "owner" | "provider" | "staff" | "customer";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  business_type?: string;
  business_type_custom?: string;
  date_of_birth?: string;
  address?: string;
  gender?: "male" | "female" | "other";
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  admin_id: string;
  name: string;
  description?: string;
  business_type?: string;
  business_type_custom?: string;
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
  business_id: string;
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
  business_id: string;
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
  businesses?: Business;
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
  | "pending"
  | "scheduled"
  | "confirmed"
  | "waiting"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "rejected"
  | "no-show";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type AppointmentType =
  | "consultation"
  | "follow-up"
  | "emergency"
  | "checkup";

export interface Appointment {
  id: string;
  business_id: string;
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
  approval_status: ApprovalStatus;
  appointment_type: AppointmentType;
  symptoms?: string;
  notes?: string;
  prescription?: string;
  diagnosis?: string;
  cancellation_reason?: string;
  rejection_reason?: string;
  created_at: string;
  confirmed_at?: string;
  approved_at?: string;
  rejected_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  doctors?: Doctor;
  businesses?: Business;
}

export interface Queue {
  id: string;
  business_id: string;
  department_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  max_tokens_per_day: number;
  estimated_wait_time: number;
  opening_time?: string;
  closing_time?: string;
  is_active: boolean;
  is_public?: boolean;
  qr_code_url?: string;
  current_token_number: number;
  created_at: string;
  businesses?: Business;
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
  business_id: string;
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
  businesses?: Business;
}

export interface StaffAssignment {
  id: string;
  staff_id: string;
  business_id: string;
  department_id?: string;
  assigned_by?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  businesses?: Business;
}

export interface QueueStaffAssignment {
  id: string;
  staff_id: string;
  queue_id: string;
  business_id: string;
  assigned_by?: string;
  is_active: boolean;
  created_at: string;
  queues?: Queue;
}

export type InvitationStatus = "pending" | "accepted" | "expired";

export interface Invitation {
  id: string;
  business_id: string;
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
