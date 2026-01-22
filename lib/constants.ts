export const APP_NAME = "HospitalMS";
export const APP_DESCRIPTION =
  "Hospital Queue and Appointment Management System";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  ADMIN: "/admin",
  DOCTOR: "/doctor",
  STAFF: "/staff",
  PATIENT: "/patient",
  QUEUE: "/queue",
  APPOINTMENTS: "/appointments",
} as const;

export const ROLES = {
  ADMIN: "admin",
  DOCTOR: "doctor",
  STAFF: "staff",
  PATIENT: "patient",
} as const;

export const APPOINTMENT_STATUSES = {
  SCHEDULED: "scheduled",
  CONFIRMED: "confirmed",
  WAITING: "waiting",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no-show",
} as const;

export const TOKEN_STATUSES = {
  WAITING: "waiting",
  CALLED: "called",
  SERVING: "serving",
  SERVED: "served",
  SKIPPED: "skipped",
  CANCELLED: "cancelled",
} as const;

export const APPOINTMENT_TYPES = {
  CONSULTATION: "consultation",
  FOLLOW_UP: "follow-up",
  EMERGENCY: "emergency",
  CHECKUP: "checkup",
} as const;

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DEFAULT_PAGINATION = {
  PAGE_SIZE: 10,
  PAGE_SIZES: [10, 25, 50, 100],
} as const;

export const QUERY_KEYS = {
  APPOINTMENTS: "appointments",
  QUEUES: "queues",
  TOKENS: "tokens",
  DOCTORS: "doctors",
  HOSPITALS: "hospitals",
  PROFILE: "profile",
} as const;
