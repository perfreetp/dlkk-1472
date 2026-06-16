import type { AlertLevel } from '@/types';

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return '';
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysRemaining(targetDate: string): number {
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) {
    return 0;
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getAlertLevelByDate(targetDate: string): AlertLevel {
  const daysRemaining = getDaysRemaining(targetDate);
  if (daysRemaining < 0) {
    return 'danger';
  }
  if (daysRemaining < 90) {
    return 'danger';
  }
  if (daysRemaining < 180) {
    return 'warning';
  }
  return 'normal';
}

export function isExpired(targetDate: string): boolean {
  return getDaysRemaining(targetDate) < 0;
}
