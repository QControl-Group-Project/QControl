import { UserRole } from "./types";

export const PERMISSIONS = {
  MANAGE_HOSPITAL: ["owner"],
  MANAGE_DOCTORS: ["owner"],
  MANAGE_STAFF: ["owner"],
  MANAGE_QUEUES: ["owner", "staff"],
  MANAGE_APPOINTMENTS: ["owner", "staff", "provider"],
  VIEW_ALL_APPOINTMENTS: ["owner", "staff"],
  VIEW_OWN_APPOINTMENTS: ["provider", "customer"],
  MANAGE_QUEUE_TOKENS: ["staff"],
  UPDATE_APPOINTMENT_STATUS: ["provider", "staff"],
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
