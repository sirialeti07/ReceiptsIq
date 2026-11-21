import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import type { Receipt } from '@/types/receipt';
import { formatDate, formatMoney, getDeadlineInfo } from '@/lib/deadlines';

export function AlertBanner({ receipts, onSelect }: { receipts: Receipt[]; onSelect?: (receipt: Receipt) => void }) {
  const closing = receipts.filter((receipt) => getDeadlineInfo(receipt).status === 'critical').sort((a, b) => (getDeadlineInfo(a).daysLeft ?? 9) - (getDeadlineInfo(b).daysLeft ?? 9));
  if (closing.length === 0) return null;
  const first = closing[0];
  const info = getDeadlineInfo(first);
  return <div className="flex flex-col gap-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 shadow-sm sm:flex-row sm:items-center"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FECACA]/50 text-[#DC2626]"><AlertTriangle className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-[#DC2626]">Return Window Closing Soon ({info.daysLeft}d left)</p><p className="mt-1 text-sm font-semibold text-[#7F1D1D]">Your purchase of {formatMoney(Number(first.total), first.currency)} at {first.merchant} must be returned by {formatDate(first.return_deadline)}.</p></div>{onSelect && <button onClick={() => onSelect(first)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#FECACA] bg-white px-4 py-2.5 text-sm font-bold text-[#B91C1C] transition-colors hover:bg-[#DC2626] hover:text-white">View Receipt <ArrowUpRight className="h-4 w-4" /></button>}</div>;
}
