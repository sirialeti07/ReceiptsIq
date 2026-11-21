import { Search, SlidersHorizontal } from 'lucide-react';
import type { Receipt } from '@/types/receipt';
import { ReceiptList } from '@/components/ReceiptList';

type Filter = 'all' | 'critical' | 'warning' | 'warranty' | 'expired';

interface Props {
  receipts: Receipt[];
  query: string;
  filter: Filter;
  category: string;
  categories: string[];
  onQueryChange: (value: string) => void;
  onFilterChange: (value: Filter) => void;
  onCategoryChange: (value: string) => void;
  onSelect: (receipt: Receipt) => void;
}

export function ReceiptVault({ receipts, query, filter, category, categories, onQueryChange, onFilterChange, onCategoryChange, onSelect }: Props) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2 text-[#0F172A]"><SlidersHorizontal className="h-5 w-5 text-[#4F46E5]" /><h2 className="text-xl font-extrabold">Receipt Vault</h2></div>
      <div className="grid gap-3 md:grid-cols-[1fr_190px_210px]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-600" />
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search by merchant, product (e.g. AirPods, vacuum), or SKU…" className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm text-[#0F172A] shadow-sm outline-none transition-colors focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100" />
        </div>
        <select value={category} onChange={(event) => onCategoryChange(event.target.value)} className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0F172A] shadow-sm outline-none focus:border-[#4F46E5]">
          <option value="all">All Categories</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={filter} onChange={(event) => onFilterChange(event.target.value as Filter)} className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0F172A] shadow-sm outline-none focus:border-[#4F46E5]">
          <option value="all">All Return Statuses</option>
          <option value="critical">Closing Soon</option>
          <option value="warning">Expiring</option>
          <option value="warranty">Warranty Active</option>
          <option value="expired">Expired</option>
        </select>
      </div>
      <ReceiptList receipts={receipts} onSelect={onSelect} query={query} variant="grid" />
    </section>
  );
}

export type { Filter as VaultFilter };
