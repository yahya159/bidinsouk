/**
 * Utility functions for consistent number formatting across client and server
 * Prevents hydration mismatches by using explicit locale formatting
 */

export function formatCurrency(amount: number, currency: string = 'MAD'): string {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} ${currency}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export function formatPercentage(value: number): string {
  return `${value}%`;
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}
