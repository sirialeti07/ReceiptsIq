import { useEffect } from 'react';
import {
  X,
  CreditCard,
  Tag,
  FileText,
  ShieldCheck,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { Receipt } from '@/types/receipt';
import {
  formatDate,
  formatMoney,
  getDeadlineInfo,
  badgeClasses,
  daysUntil,
} from '@/lib/deadlines';

interface Props {
  receipt: Receipt;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function ReceiptDetail({ receipt, onClose, onDelete }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const info = getDeadlineInfo(receipt);
  const bc = badgeClasses(info.status);
  const returnDays = daysUntil(receipt.return_deadline);
  const warrantyDays = daysUntil(receipt.warranty_deadline);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F172A]/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-3.5 backdrop-blur">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-[#0F172A]">{receipt.merchant}</h2>
            <p className="text-xs text-slate-500">{formatDate(receipt.purchase_date)}</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0F172A]"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Total + badge */}
          <div className="flex items-end justify-between rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Total</p>
              <p className="mt-0.5 text-3xl font-bold tabular-nums text-[#0F172A]">
                {formatMoney(Number(receipt.total), receipt.currency)}
              </p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${bc.bg} ${bc.text} ${bc.border}`}>
              {info.label}
            </span>
          </div>

          {/* Deadline timeline */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 p-3.5">
              <div className="flex items-center gap-2 text-[#B45309]">
                <RotateCcw className="h-4 w-4" />
                <p className="text-xs font-bold">Return Window</p>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-[#0F172A]">
                {formatDate(receipt.return_deadline)}
              </p>
              <p className="text-xs text-slate-500">
                {returnDays !== null && returnDays >= 0
                  ? `${returnDays} days remaining`
                  : 'Window closed'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3.5">
              <div className="flex items-center gap-2 text-[#0369A1]">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-xs font-bold">Warranty</p>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-[#0F172A]">
                {formatDate(receipt.warranty_deadline)}
              </p>
              <p className="text-xs text-slate-500">
                {warrantyDays !== null && warrantyDays > 0
                  ? `${warrantyDays} days remaining`
                  : 'Expired'}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <MetaRow icon={Tag} label="Category" value={receipt.category ?? '—'} />
            <MetaRow icon={CreditCard} label="Payment" value={receipt.payment_method ?? '—'} />
          </div>

          {/* Items */}
          {receipt.items.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Items</p>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {receipt.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="min-w-0 truncate text-sm text-[#0F172A]">
                      {it.name}
                      {it.qty > 1 && <span className="ml-1.5 text-xs text-slate-400">×{it.qty}</span>}
                    </span>
                    <span className="ml-3 shrink-0 text-sm font-semibold tabular-nums text-[#0F172A]">
                      {formatMoney(it.price, receipt.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw OCR text */}
          {receipt.ocr_raw_text && (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                <FileText className="h-3.5 w-3.5" />
                OCR Source Text
              </div>
              <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3.5 font-mono text-[11px] leading-relaxed text-slate-600">
                {receipt.ocr_raw_text}
              </pre>
            </div>
          )}

          {/* Delete */}
          <button
            onClick={() => onDelete(receipt.id)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] py-2.5 text-sm font-semibold text-[#DC2626] transition-colors hover:bg-[#DC2626] hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
            Delete Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3.5">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-[11px] font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-1 text-sm font-semibold text-[#0F172A]">{value}</p>
    </div>
  );
}
