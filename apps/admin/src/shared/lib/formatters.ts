/**
 * Shared formatting utilities
 * FSD v2.1: Shared - Library Layer
 */

/**
 * Format date to Korean locale string
 */
export function formatDate(
  dateString: string | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!dateString) return 'N/A';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  return new Date(dateString).toLocaleDateString('ko-KR', defaultOptions);
}

/**
 * Format price to Korean won
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}
