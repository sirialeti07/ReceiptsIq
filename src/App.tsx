import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Loader2, Plus, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Receipt, ReceiptInput } from '@/types/receipt';
import { getDeadlineInfo } from '@/lib/deadlines';
import { Header, type View } from '@/components/Header';
import { AlertBanner } from '@/components/AlertBanner';
import { KpiCards } from '@/components/KpiCards';
import { DashboardPanels } from '@/components/DashboardPanels';
import { ReceiptVault, type VaultFilter } from '@/components/ReceiptVault';
import { InjectReceiptModal } from '@/components/InjectReceiptModal';
import { ReceiptDetail } from '@/components/ReceiptDetail';
import { Chatbot } from '@/components/Chatbot';

export default function App() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInject, setShowInject] = useState(false);
  const [selected, setSelected] = useState<Receipt | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<VaultFilter>('all');
  const [category, setCategory] = useState('all');

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('receipts').select('*').order('purchase_date', { ascending: false });
    if (error) console.error('Failed to load receipts', error);
    setReceipts((data ?? []) as Receipt[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadReceipts(); }, [loadReceipts]);

  const handleSave = async (input: ReceiptInput) => {
    const { error } = await supabase.from('receipts').insert({
      merchant: input.merchant,
      purchase_date: input.purchase_date,
      total: input.total,
      currency: input.currency ?? 'USD',
      items: input.items,
      category: input.category ?? null,
      payment_method: input.payment_method ?? null,
      ocr_raw_text: input.ocr_raw_text ?? null,
      image_url: input.image_url ?? null,
      return_window_days: input.return_window_days ?? 30,
      warranty_window_days: input.warranty_window_days ?? 365,
      notes: input.notes ?? null,
    });
    if (error) throw error;
    await loadReceipts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('receipts').delete().eq('id', id);
    if (error) { console.error('Delete failed', error); return; }
    setSelected(null);
    await loadReceipts();
  };

  const categories = useMemo(() => [...new Set(receipts.map((receipt) => receipt.category).filter((item): item is string => Boolean(item)))].sort(), [receipts]);

  const filtered = useMemo(() => {
    let pool = receipts;
    if (filter !== 'all') pool = pool.filter((receipt) => getDeadlineInfo(receipt).status === filter);
    if (category !== 'all') pool = pool.filter((receipt) => receipt.category === category);
    if (query.trim()) {
      const term = query.toLowerCase();
      pool = pool.filter((receipt) => receipt.merchant.toLowerCase().includes(term) || (receipt.category ?? '').toLowerCase().includes(term) || receipt.items.some((item) => item.name.toLowerCase().includes(term)));
    }
    return pool;
  }, [receipts, filter, category, query]);

  const resetBenchmark = () => {
    setQuery('');
    setFilter('all');
    setCategory('all');
    setView('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Header view={view} onViewChange={setView} onInject={() => setShowInject(true)} onReset={resetBenchmark} />
      <main className="mx-auto max-w-[1440px] space-y-6 px-5 py-6 pb-24 lg:px-8">
        {loading ? <div className="flex min-h-[60vh] items-center justify-center text-slate-400"><Loader2 className="h-7 w-7 animate-spin" /></div> : (
          <>
            {view === 'dashboard' && <DashboardView receipts={receipts} onSelect={setSelected} onInject={() => setShowInject(true)} />}
            {view === 'vault' && <ReceiptVault receipts={filtered} query={query} filter={filter} category={category} categories={categories} onQueryChange={setQuery} onFilterChange={setFilter} onCategoryChange={setCategory} onSelect={setSelected} />}
            {view === 'chatbot' && <ChatbotView />}
            {view === 'sandbox' && <SandboxView receipts={receipts} />}
          </>
        )}
      </main>

      {showInject && <InjectReceiptModal onClose={() => setShowInject(false)} onSave={handleSave} />}
      {selected && <ReceiptDetail receipt={selected} onClose={() => setSelected(null)} onDelete={handleDelete} />}
      <Chatbot />
    </div>
  );
}

function DashboardView({ receipts, onSelect, onInject }: { receipts: Receipt[]; onSelect: (receipt: Receipt) => void; onInject: () => void }) {
  return (
    <>
      <AlertBanner receipts={receipts} onSelect={onSelect} />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4F46E5]">Receipt intelligence workspace</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">Dashboard</h1><p className="mt-1 text-sm text-slate-500">A live view of your spending, return windows, and warranty coverage.</p></div>
        <button onClick={onInject} className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-[#0F172A] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E293B] sm:self-auto"><Plus className="h-4 w-4" />Ingest receipt</button>
      </div>
      <KpiCards receipts={receipts} />
      <DashboardPanels receipts={receipts} onSelect={onSelect} />
    </>
  );
}

function ChatbotView() {
  return <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><div className="mx-auto max-w-2xl text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5]"><Bot className="h-7 w-7" /></div><h1 className="mt-5 text-3xl font-extrabold text-[#0F172A]">AI Chatbot</h1><p className="mt-2 text-slate-500">Ask ReceiptIQ about your spending, search the vault, or find the next return deadline. The assistant is ready in the bottom-right corner.</p><div className="mt-6 grid gap-3 text-left sm:grid-cols-3"><Prompt label="Deadlines" text="What's expiring soon?" /><Prompt label="Spending" text="How much did I spend this month?" /><Prompt label="Search" text="Find my headphones receipt" /></div></div></section>;
}

function Prompt({ label, text }: { label: string; text: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#4F46E5]">{label}</p><p className="mt-2 text-sm font-semibold text-[#0F172A]">{text}</p></div>;
}

function SandboxView({ receipts }: { receipts: Receipt[] }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><Sparkles className="h-5 w-5" /></div><div><h1 className="text-2xl font-extrabold text-[#0F172A]">CORD-v2 Sandbox</h1><p className="text-sm text-slate-500">OCR benchmark workspace for {receipts.length} loaded receipt records.</p></div></div><div className="mt-8 grid gap-4 sm:grid-cols-3"><SandboxMetric label="Receipts available" value={String(receipts.length)} /><SandboxMetric label="OCR source text" value={String(receipts.filter((receipt) => receipt.ocr_raw_text).length)} /><SandboxMetric label="Parsed item lines" value={String(receipts.reduce((total, receipt) => total + receipt.items.length, 0))} /></div></section>;
}

function SandboxMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-3 text-3xl font-extrabold tabular-nums text-[#0F172A]">{value}</p></div>;
}
