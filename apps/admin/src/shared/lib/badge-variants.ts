/**
 * Shared badge variant utilities
 * FSD v2.1: Shared - Library Layer
 */

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

/**
 * Get badge variant for booking/performance status
 */
export function getStatusColor(status: string): BadgeVariant {
  switch (status) {
    case 'ONGOING':
    case 'CONFIRMED':
    case 'ACTIVE':
      return 'default';
    case 'UPCOMING':
    case 'INACTIVE':
      return 'secondary';
    case 'ENDED':
      return 'outline';
    case 'CANCELLED':
    case 'SUSPENDED':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Get badge variant for user role
 */
export function getRoleColor(role: string): BadgeVariant {
  switch (role) {
    case 'ADMIN':
      return 'destructive';
    case 'DEVOPS':
      return 'default';
    case 'DEV':
      return 'secondary';
    case 'USER':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Get badge variant for payment status
 */
export function getPaymentStatusColor(status: string): BadgeVariant {
  switch (status) {
    case 'COMPLETED':
      return 'default';
    case 'PENDING':
      return 'secondary';
    case 'FAILED':
      return 'destructive';
    default:
      return 'outline';
  }
}
