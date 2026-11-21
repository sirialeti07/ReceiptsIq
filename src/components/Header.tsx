import { Bot, FileText, LayoutDashboard, Plus, RotateCcw, ScanLine, Sparkles, TestTube2 } from 'lucide-react';

type View = 'dashboard' | 'vault' | 'chatbot' | 'sandbox';

interface Props {
  view: View;
  onViewChange: (view: View) => void;
  onInject: () => void;
  onReset: () => void;
}

const navItems: { key: View; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'vault', label: 'Receipt Vault', icon: FileText },
  { key: 'chatbot', label: 'AI Chatbot', icon: Bot },
  { key: 'sandbox', label: 'CORD-v2 Sandbox', icon: TestTube2 },
];

export function Header({ view, onViewChange, onInject, onReset }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B1528] text-white shadow-lg shadow-slate-900/10">
      <div className="mx-auto flex min-h-[68px] max-w-[1440px] items-center gap-5 px-5 lg:px-8">
        <button onClick={() => onViewChange('dashboard')} className="flex shrink-0 items-center gap-3 text-left">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#2563EB] shadow-lg shadow-blue-900/30">
            <ScanLine className="h-5 w-5" strokeWidth={2.3} />
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-[18px] font-extrabold tracking-tight">ReceiptIQ</div>
            <div className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
              <Sparkles className="h-3 w-3" /> CORD-v2 Agent
            </div>
          </div>
        </button>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
          {navItems.map(({ key, label, icon: Icon }) => {
            const active = view === key;
            return (
              <button
                key={key}
                onClick={() => onViewChange(key)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active ? 'bg-[#5146E5] text-white shadow-lg shadow-indigo-950/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            onClick={onReset}
            className="hidden items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-200 transition-colors hover:bg-white/10 sm:inline-flex"
          >
            <RotateCcw className="h-3.5 w-3.5 text-blue-300" />
            Reset Benchmark
          </button>
          <button
            onClick={onInject}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#5548E8] to-[#4F46E5] px-3.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-950/30 transition-all hover:brightness-110 active:scale-[0.98] sm:px-4 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            Ingest Receipt
          </button>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 lg:hidden">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onViewChange(key)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${view === key ? 'bg-[#5146E5] text-white' : 'text-slate-300'}`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>
    </header>
  );
}

export type { View };
