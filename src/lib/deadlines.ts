import type { Receipt, DeadlineStatus } from '@/types/receipt';

export function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline + 'T00:00:00');
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export interface DeadlineInfo {
  label: string;
  status: DeadlineStatus;
  daysLeft: number | null;
}

/**
 * Return-window status takes priority. If the return window is still open,
 * the badge reflects that. Once the return window closes, we surface the
 * warranty window if it is still active, otherwise EXPIRED.
 */
export function getDeadlineInfo(receipt: Receipt): DeadlineInfo {
  const returnDays = daysUntil(receipt.return_deadline);
  const warrantyDays = daysUntil(receipt.warranty_deadline);

  if (returnDays !== null && returnDays >= 0) {
    if (returnDays <= 2) {
      return { label: `${returnDays}D LEFT`, status: 'critical', daysLeft: returnDays };
    }
    if (returnDays <= 14) {
      return { label: `${returnDays}D LEFT`, status: 'warning', daysLeft: returnDays };
    }
    return { label: `${returnDays}D LEFT`, status: 'safe', daysLeft: returnDays };
  }

  // Return window closed — check warranty
  if (warrantyDays !== null && warrantyDays > 0) {
    return { label: `WARRANTY ${warrantyDays}D`, status: 'warranty', daysLeft: warrantyDays };
  }

  return { label: 'EXPIRED', status: 'expired', daysLeft: null };
}

export interface BadgeClasses {
  bg: string;
  text: string;
  border: string;
  ring: string;
}

/**
 * Exact palette specified for ReceiptIQ:
 * - Critical / Expired: Soft Rose (#FEF2F2) bg, Crimson (#DC2626) text, #FECACA border
 * - Approaching / Warning: Soft Marigold (#FFFBEB) bg, Amber-Brown (#B45309) text
 * - Safe: Soft Mint (#ECFDF5) bg, Emerald (#047857) text
 * - Warranty: Soft Sky (#F0F9FF) bg, Cobalt (#0369A1) text
 */
export function badgeClasses(status: DeadlineStatus): BadgeClasses {
  switch (status) {
    case 'critical':
    case 'expired':
      return {
        bg: 'bg-[#FEF2F2]',
        text: 'text-[#DC2626]',
        border: 'border-[#FECACA]',
        ring: 'ring-[#FECACA]',
      };
    case 'warning':
      return {
        bg: 'bg-[#FFFBEB]',
        text: 'text-[#B45309]',
        border: 'border-[#FDE68A]',
        ring: 'ring-[#FDE68A]',
      };
    case 'safe':
      return {
        bg: 'bg-[#ECFDF5]',
        text: 'text-[#047857]',
        border: 'border-[#A7F3D0]',
        ring: 'ring-[#A7F3D0]',
      };
    case 'warranty':
      return {
        bg: 'bg-[#F0F9FF]',
        text: 'text-[#0369A1]',
        border: 'border-[#BAE6FD]',
        ring: 'ring-[#BAE6FD]',
      };
  }
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMoney(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
