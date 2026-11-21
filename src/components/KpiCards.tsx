import { Clock3, ReceiptText, ShieldCheck, TrendingUp } from 'lucide-react';
import type { Receipt } from '@/types/receipt';
import { daysUntil, formatMoney, getDeadlineInfo } from '@/lib/deadlines';

interface Props { receipts: Receipt[]; }

export function KpiCards({ receipts }: Props) {
  const total = receipts.reduce((sum, receipt) => sum + Number(receipt.total), 0);
  const expiring = receipts.filter((receipt) => ['critical', 'warning'].includes(getDeadlineInfo(receipt).status) && (getDeadlineInfo(receipt).daysLeft ?? 999) <= 7).length;
  const activeReturns = receipts.filter((receipt) => {
    const days = daysUntil(receipt.return_deadline);
    return days !== null && days >= 0;
  }).length;
  const warranties = receipts.filter((receipt) => {
    const days = daysUntil(receipt.warranty_deadline);
    return days !== null && days > 0;
  }).length;

  const cards = [
    { label: 'Total Spend Tracked', value: formatMoney(total), sub: `${receipts.length} receipts ingested`, icon: TrendingUp, tone: 'neutral' },
    { label: 'Expiring Return Windows', value: String(expiring), sub: 'Within next 7 days', icon: Clock3, tone: 'warning' },
    { label: 'Active Return Windows', value: String(activeReturns), sub: 'Eligible for return', icon: ReceiptText, tone: 'success' },
    { label: 'Protected Warranties', value: String(warranties), sub: 'Active manufacturer coverage', icon: ShieldCheck, tone: 'info' },
  ];

  const tones: Record<string, string> = {
    neutral: 'border-slate-200 border-t-[#0F172A] bg-white text-[#0F172A]',
    warning: 'border-[#FDE68A] border-t-[#B45309] bg-[#FFFBEB] text-[#B45309]',
    success: 'border-[#A7F3D0] border-t-[#047857] bg-[#ECFDF5] text-[#047857]',
    info: 'border-[#BAE6FD] border-t-[#0369A1] bg-[#F0F9FF] text-[#0369A1]',
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, sub, icon: Icon, tone }) => (
        <div key={label} className={`rounded-xl border border-t-4 px-5 py-5 shadow-sm ${tones[tone]}`}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] opacity-80">{label}</p>
            <Icon className="h-5 w-5 shrink-0" strokeWidth={2.2} />
          </div>
          <p className="mt-3 text-[30px] font-extrabold leading-none tracking-tight tabular-nums">{value}</p>
          <p className="mt-2 text-sm font-semibold opacity-90">{sub}</p>
        </div>
      ))}
    </div>
  );
}
