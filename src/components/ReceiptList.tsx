import { getDeadlineInfo, badgeClasses, formatDate, formatMoney } from '@/lib/deadlines';
import type { Receipt } from '@/types/receipt';
import { Calendar, ChevronRight, Tag } from 'lucide-react';

interface Props {
  receipts: Receipt[];
  onSelect: (r: Receipt) => void;
  query: string;
  variant?: 'list' | 'grid';
}

export function ReceiptList({ receipts, onSelect, query, variant = 'list' }: Props) {
  if (receipts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm font-semibold text-[#0F172A]">No receipts found</p>
        <p className="mt-1 text-xs text-slate-500">
          {query ? 'Try a different search.' : 'Inject a receipt to get started.'}
        </p>
      </div>
    );
  }

  return (
    <div className={variant === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-4' : 'space-y-2.5'}>
      {receipts.map((r) => {
        const info = getDeadlineInfo(r);
        const bc = badgeClasses(info.status);
        if (variant === 'grid') {
          return (
            <button key={r.id} onClick={() => onSelect(r)} className="group flex min-h-[250px] flex-col rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-base font-extrabold text-[#0F172A]">{r.merchant}</p><p className="mt-1 text-xs font-medium text-slate-500">{formatDate(r.purchase_date)} · {r.category || 'Other'}</p></div>
                <span className="shrink-0 text-xl font-extrabold tabular-nums text-[#0F172A]">{formatMoney(Number(r.total), r.currency)}</span>
              </div>
              <div className="mt-4 min-h-[82px] rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-600">
                {r.items.slice(0, 3).map((item) => <p key={`${r.id}-${item.name}`} className="truncate">• {item.name} <span className="font-bold text-[#0F172A]">({formatMoney(item.price, r.currency)})</span></p>)}
                {r.items.length > 3 && <p className="mt-1 text-slate-400">+ {r.items.length - 3} more items…</p>}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold tracking-wide ${bc.bg} ${bc.text} ${bc.border}`}>{info.label}</span>
                <span className="text-xs font-medium text-slate-500">{r.items.length} item{r.items.length === 1 ? '' : 's'}</span>
              </div>
            </button>
          );
        }
        return (
          <button key={r.id} onClick={() => onSelect(r)} className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-slate-300 hover:shadow-md">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-50 text-[#0F172A]/70"><span className="text-[13px] font-bold tracking-tight">{r.merchant.slice(0, 2).toUpperCase()}</span></div>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-[#0F172A]">{r.merchant}</p>{r.category && <span className="hidden shrink-0 items-center gap-1 text-[11px] font-medium text-slate-400 sm:inline-flex"><Tag className="h-3 w-3" />{r.category}</span>}</div><div className="mt-1 flex items-center gap-3 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(r.purchase_date)}</span><span className="font-semibold tabular-nums text-[#0F172A]">{formatMoney(Number(r.total), r.currency)}</span><span className="hidden text-slate-400 sm:inline">{r.items.length} item{r.items.length === 1 ? '' : 's'}</span></div></div>
            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${bc.bg} ${bc.text} ${bc.border}`}>{info.label}</span><ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" />
          </button>
        );
      })}
    </div>
  );
}
