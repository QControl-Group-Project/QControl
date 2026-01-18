import { z } from "zod";

// User validation
export const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

// Queue token validation
export const queueTokenSchema = z.object({
  queue_id: z.string().uuid("Invalid queue ID"),
  patient_name: z.string().min(2, "Name must be at least 2 characters"),
  patient_phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional(),
  patient_age: z.number().min(0).max(150).optional(),
  purpose: z.string().optional(),
});

// Appointment validation
export const appointmentSchema = z.object({
  doctor_id: z.string().uuid("Invalid doctor ID"),
  hospital_id: z.string().uuid("Invalid hospital ID"),
  patient_name: z.string().min(2, "Name must be at least 2 characters"),
  patient_phone: z.string().min(10, "Phone number must be at least 10 digits"),
  patient_email: z.string().email("Invalid email").optional(),
  patient_age: z.number().min(0).max(150).optional(),
  patient_gender: z.enum(["male", "female", "other"]).optional(),
  appointment_date: z.string().refine((date) => {
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate >= today;
  }, "Appointment date must be today or in the future"),
  appointment_time: z.string(),
  appointment_type: z.enum([
    "consultation",
    "follow-up",
    "emergency",
    "checkup",
  ]),
  symptoms: z.string().optional(),
});

// Hospital validation
export const hospitalSchema = z.object({
  name: z.string().min(2, "Hospital name must be at least 2 characters"),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  website: z.string().url("Invalid URL").optional(),
  opening_time: z.string().optional(),
  closing_time: z.string().optional(),
});

// Doctor validation
export const doctorSchema = z.object({
  profile_id: z.string().uuid(),
  hospital_id: z.string().uuid(),
  department_id: z.string().uuid().optional(),
  specialization_id: z.string().uuid().optional(),
  license_number: z.string().min(3, "License number is required"),
  qualification: z.string().optional(),
  experience_years: z.number().min(0).optional(),
  consultation_fee: z.number().min(0).optional(),
  bio: z.string().optional(),
});

// Doctor schedule validation
export const doctorScheduleSchema = z.object({
  doctor_id: z.string().uuid(),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Invalid time format"),
  end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Invalid time format"),
  slot_duration: z.number().min(5).max(120),
  max_patients_per_slot: z.number().min(1).max(10),
});

// Queue validation
export const queueSchema = z.object({
  hospital_id: z.string().uuid(),
  department_id: z.string().uuid().optional(),
  name: z.string().min(2, "Queue name must be at least 2 characters"),
  description: z.string().optional(),
  max_tokens_per_day: z.number().min(1).max(1000),
  estimated_wait_time: z.number().min(1).max(120),
  opening_time: z.string().optional(),
  closing_time: z.string().optional(),
});

// Login validation
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Register validation
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  role: z.enum(["admin", "doctor", "staff", "patient"]).default("patient"),
});
