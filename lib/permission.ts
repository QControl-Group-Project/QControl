import { UserRole } from "./types";

export const PERMISSIONS = {
  MANAGE_HOSPITAL: ["admin"],
  MANAGE_DOCTORS: ["admin"],
  MANAGE_STAFF: ["admin"],
  MANAGE_QUEUES: ["admin", "staff"],
  MANAGE_APPOINTMENTS: ["admin", "staff", "doctor"],
  VIEW_ALL_APPOINTMENTS: ["admin", "staff"],
  VIEW_OWN_APPOINTMENTS: ["doctor", "patient"],
  MANAGE_QUEUE_TOKENS: ["staff"],
  UPDATE_APPOINTMENT_STATUS: ["doctor", "staff"],
} as const satisfies Record<string, UserRole[]>;

export function hasPermission(
  userRole: UserRole,
  permission: keyof typeof PERMISSIONS
): boolean {
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(userRole);
}

export function canManageHospital(role: UserRole): boolean {
  return hasPermission(role, "MANAGE_HOSPITAL");
}

export function canManageQueues(role: UserRole): boolean {
  return hasPermission(role, "MANAGE_QUEUES");
}

export function canManageAppointments(role: UserRole): boolean {
  return hasPermission(role, "MANAGE_APPOINTMENTS");
}
