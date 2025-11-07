/**
 * Admin Permission Utilities
 * Role-based access control helpers
 */

export type UserRole = 'USER' | 'ADMIN' | 'DEV' | 'DEVOPS' | string;

export interface PermissionConfig {
  readonly roles: readonly UserRole[];
  requireAll?: boolean; // true면 모든 role 필요, false면 하나만 있어도 됨 (기본: false)
}

/**
 * Check if user has required role(s)
 */
export function hasRole(
  userRole: UserRole | undefined,
  allowedRoles: readonly UserRole[],
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Check if user has permission based on role
 */
export function hasPermission(userRole: UserRole | undefined, config: PermissionConfig): boolean {
  if (!userRole) return false;

  if (config.requireAll) {
    // 모든 role이 필요한 경우
    return config.roles.every((role) => userRole === role);
  } else {
    // 하나의 role만 있으면 되는 경우 (기본)
    return config.roles.includes(userRole);
  }
}

/**
 * Admin permissions map
 */
export const ADMIN_PERMISSIONS = {
  // 대시보드 - 모든 관리자
  viewDashboard: { roles: ['ADMIN', 'DEV', 'DEVOPS'] },

  // 사용자 관리 - ADMIN만
  viewUsers: { roles: ['ADMIN'] },
  createUser: { roles: ['ADMIN'] },
  updateUser: { roles: ['ADMIN'] },
  deleteUser: { roles: ['ADMIN'] },

  // 공연 관리 - ADMIN, DEV
  viewPerformances: { roles: ['ADMIN', 'DEV'] },
  createPerformance: { roles: ['ADMIN', 'DEV'] },
  updatePerformance: { roles: ['ADMIN', 'DEV'] },
  deletePerformance: { roles: ['ADMIN', 'DEV'] },

  // 예매 관리 - ADMIN, DEV
  viewBookings: { roles: ['ADMIN', 'DEV'] },
  cancelBooking: { roles: ['ADMIN', 'DEV'] },

  // 시스템 관리 - ADMIN, DEVOPS
  viewSystem: { roles: ['ADMIN', 'DEVOPS'] },
  manageInfrastructure: { roles: ['DEVOPS'] },
} as const;

/**
 * Check if user can access a specific permission
 */
export function canAccess(
  userRole: UserRole | undefined,
  permission: keyof typeof ADMIN_PERMISSIONS,
): boolean {
  const config = ADMIN_PERMISSIONS[permission];
  return hasPermission(userRole, config);
}
