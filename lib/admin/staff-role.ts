/**
 * Staff roles from `GET /api/v1/auth/me` (`UserRead.role`).
 * A viewer can read inventory. An editor or superadmin can change it.
 * A missing role is not treated as a viewer: older sessions only stored the email.
 */

export const STAFF_ROLES = ["viewer", "editor", "superadmin"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(value: unknown): value is StaffRole {
  return value === "viewer" || value === "editor" || value === "superadmin";
}

/** True unless the signed-in staff member is a viewer. */
export function canWriteInventory(role: string | null | undefined) {
  return role !== "viewer";
}
