import { CalendarClock, ChevronRight, Clock3, Tag, WalletCards } from 'lucide-react';
import type { Receipt } from '@/types/receipt';
import { badgeClasses, daysUntil, formatDate, formatMoney, getDeadlineInfo } from '@/lib/deadlines';

interface Props { receipts: Receipt[]; onSelect: (receipt: Receipt) => void; }

const categoryColors = ['#2563EB', '#14B8A6', '#4F46E5', '#F59E0B', '#0EA5E9', '#64748B'];

export function DashboardPanels({ receipts, onSelect }: Props) {
  const total = receipts.reduce((sum, receipt) => sum + Number(receipt.total), 0) || 1;
  const categoryTotals = new Map<string, number>();
  receipts.forEach((receipt) => {
    const category = receipt.category || 'Other';
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + Number(receipt.total));
  });
  const categories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
  const deadlines = receipts
    .map((receipt) => ({ receipt, info: getDeadlineInfo(receipt), days: daysUntil(receipt.return_deadline) }))
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999))
    .slice(0, 5);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#FEF3C7] text-[#B45309]"><Tag className="h-4 w-4" /></div>
            <h2 className="text-base font-extrabold text-[#0F172A]">Spending Allocation by Category</h2>
          </div>
          <span className="hidden text-xs font-medium text-slate-400 sm:block">Real-Time Post-OCR Rollup</span>
        </div>
        <div className="space-y-5">
          {categories.length === 0 ? <EmptyPanel label="Ingest receipts to see category allocation." /> : categories.map(([category, amount], index) => {
            const percent = Math.round((amount / total) * 100);
            return (
              <div key={category}>
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                  <span className="font-semibold text-slate-600">{category}</span>
                  <span className="font-bold tabular-nums text-[#0F172A]">{formatMoney(amount)} ({percent}%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${Math.max(percent, 2)}%`, backgroundColor: categoryColors[index % categoryColors.length] }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#F1F5F9] text-[#0F172A]"><CalendarClock className="h-4 w-4" /></div>
            <h2 className="text-base font-extrabold text-[#0F172A]">Return &amp; Warranty Deadline Horizon</h2>
          </div>
          <Clock3 className="h-4 w-4 text-slate-400" />
        </div>
        <div className="space-y-3">
          {deadlines.length === 0 ? <EmptyPanel label="Your deadline horizon will appear here." /> : deadlines.map(({ receipt, info }) => {
            const colors = badgeClasses(info.status);
            return (
              <button key={receipt.id} onClick={() => onSelect(receipt)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3.5 text-left transition-all hover:border-slate-300 hover:shadow-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#0F172A]">{receipt.merchant} · {formatMoney(Number(receipt.total), receipt.currency)}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{receipt.items.slice(0, 2).map((item) => item.name).join(', ') || 'Receipt record'}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">Purchase {formatDate(receipt.purchase_date)}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${colors.bg} ${colors.text} ${colors.border}`}>{info.label}</span>
                <ChevronRight className="hidden h-4 w-4 text-slate-300 sm:block" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center text-sm text-slate-400"><WalletCards className="mb-2 h-7 w-7" /><span>{label}</span></div>;
}
