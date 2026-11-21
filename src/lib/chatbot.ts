import { supabase } from './supabase';
import type { Receipt } from '@/types/receipt';
import { daysUntil, formatDate, formatMoney, getDeadlineInfo } from './deadlines';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Intent {
  type: 'spending' | 'deadline' | 'search' | 'list' | 'summary' | 'help' | 'unknown';
  query?: string;
  merchant?: string;
  days?: number;
}

const HELP_TEXT = `I can help you with your receipts. Try asking:
• "How much did I spend at Target?"
• "What's expiring soon?"
• "Show receipts from Best Buy"
• "What returns close in the next 7 days?"
• "Total spent this month"
• "Find receipts with headphones"`;

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/\b(help|what can you do|commands)\b/.test(t)) return { type: 'help' };

  if (/(expir|deadline|closing|return window|warranty|soon|urgent)/.test(t)) {
    const daysMatch = t.match(/(\d+)\s*day/);
    return { type: 'deadline', days: daysMatch ? parseInt(daysMatch[1], 10) : 14 };
  }

  if (/(spent|spend|total|how much|spending)/.test(t)) {
    return { type: 'spending', query: text };
  }

  if (/(show|find|list|search|receipts from|receipts with|look up)/.test(t)) {
    return { type: 'search', query: text };
  }

  if (/(summary|overview|stats|how many receipts)/.test(t)) {
    return { type: 'summary' };
  }

  return { type: 'unknown', query: text };
}

function extractMerchant(text: string): string | null {
  // "receipts from Best Buy", "at Target"
  const m = text.match(/(?:from|at|for)\s+([A-Z][A-Za-z0-9 &'.\-#/+]{1,30})/);
  if (m) return m[1].trim();
  const m2 = text.match(/"([^"]+)"/);
  if (m2) return m2[1].trim();
  return null;
}

async function fetchAll(): Promise<Receipt[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .order('purchase_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Receipt[];
}

function merchantFilter(receipts: Receipt[], name: string): Receipt[] {
  const q = name.toLowerCase();
  return receipts.filter((r) => r.merchant.toLowerCase().includes(q));
}

async function handleSpending(intent: Intent, receipts: Receipt[]): Promise<string> {
  const merchant = intent.query ? extractMerchant(intent.query) : null;
  let pool = receipts;
  let scope = 'across all receipts';

  // "this month" / "last month"
  const now = new Date();
  if (/this month/.test((intent.query ?? '').toLowerCase())) {
    pool = receipts.filter((r) => {
      const d = new Date(r.purchase_date + 'T00:00:00');
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    scope = 'this month';
  } else if (/last month/.test((intent.query ?? '').toLowerCase())) {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    pool = receipts.filter((r) => {
      const d = new Date(r.purchase_date + 'T00:00:00');
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });
    scope = 'last month';
  } else if (merchant) {
    pool = merchantFilter(receipts, merchant);
    scope = `at ${merchant}`;
  }

  if (pool.length === 0) {
    return `I couldn't find any receipts ${scope}.`;
  }
  const total = pool.reduce((s, r) => s + Number(r.total), 0);
  return `You've spent **${formatMoney(total)}** ${scope}, across ${pool.length} receipt${pool.length === 1 ? '' : 's'}.`;
}

async function handleDeadline(intent: Intent, receipts: Receipt[]): Promise<string> {
  const window = intent.days ?? 14;
  const closing: Receipt[] = [];
  for (const r of receipts) {
    const info = getDeadlineInfo(r);
    const d = info.daysLeft;
    if (d !== null && d >= 0 && d <= window && (info.status === 'critical' || info.status === 'warning')) {
      closing.push(r);
    }
  }
  if (closing.length === 0) {
    return `No return windows are closing in the next ${window} days. You're all clear.`;
  }
  const lines = closing
    .sort((a, b) => (daysUntil(a.return_deadline) ?? 999) - (daysUntil(b.return_deadline) ?? 999))
    .map((r) => {
      const info = getDeadlineInfo(r);
      return `• **${r.merchant}** — ${info.label}, returns due ${formatDate(r.return_deadline)} (${formatMoney(Number(r.total))})`;
    });
  return `${closing.length} receipt${closing.length === 1 ? '' : 's'} have return windows closing within ${window} days:\n${lines.join('\n')}`;
}

async function handleSearch(intent: Intent, receipts: Receipt[]): Promise<string> {
  const merchant = intent.query ? extractMerchant(intent.query) : null;
  const term = intent.query ? intent.query.replace(/.*(?:with|containing|for)\s+/i, '').replace(/["']/g, '').trim() : '';
  let pool = receipts;
  if (merchant) pool = merchantFilter(pool, merchant);
  if (term && term.length > 2 && !/^(show|find|list|search|receipts)$/i.test(term)) {
    const t = term.toLowerCase();
    pool = pool.filter((r) =>
      r.items.some((i) => i.name.toLowerCase().includes(t)) ||
      r.merchant.toLowerCase().includes(t) ||
      (r.category ?? '').toLowerCase().includes(t),
    );
  }
  if (pool.length === 0) return 'No receipts match that search.';
  const lines = pool.slice(0, 8).map((r) => {
    const info = getDeadlineInfo(r);
    return `• **${r.merchant}** — ${formatDate(r.purchase_date)}, ${formatMoney(Number(r.total))} [${info.label}]`;
  });
  const more = pool.length > 8 ? `\n…and ${pool.length - 8} more` : '';
  return `Found ${pool.length} matching receipt${pool.length === 1 ? '' : 's'}:\n${lines.join('\n')}${more}`;
}

async function handleSummary(receipts: Receipt[]): Promise<string> {
  if (receipts.length === 0) {
    return "You don't have any receipts yet. Upload one with the Inject Receipt button to get started.";
  }
  const total = receipts.reduce((s, r) => s + Number(r.total), 0);
  const expired = receipts.filter((r) => getDeadlineInfo(r).status === 'expired').length;
  const critical = receipts.filter((r) => getDeadlineInfo(r).status === 'critical').length;
  const warranty = receipts.filter((r) => getDeadlineInfo(r).status === 'warranty').length;
  const byMerchant = new Map<string, number>();
  for (const r of receipts) byMerchant.set(r.merchant, (byMerchant.get(r.merchant) ?? 0) + Number(r.total));
  const top = [...byMerchant.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topLines = top.map(([m, v]) => `• ${m}: ${formatMoney(v)}`).join('\n');
  return `You have **${receipts.length}** receipts totaling **${formatMoney(total)}**.
${critical > 0 ? `${critical} return window${critical === 1 ? '' : 's'} closing soon, ` : ''}${warranty} under warranty, ${expired} expired.

Top merchants:
${topLines}`;
}

export async function answerQuery(userText: string): Promise<string> {
  const intent = detectIntent(userText);
  if (intent.type === 'help') return HELP_TEXT;

  let receipts: Receipt[];
  try {
    receipts = await fetchAll();
  } catch {
    return "I couldn't reach your receipt database right now. Please try again in a moment.";
  }

  switch (intent.type) {
    case 'spending':
      return handleSpending(intent, receipts);
    case 'deadline':
      return handleDeadline(intent, receipts);
    case 'search':
      return handleSearch(intent, receipts);
    case 'summary':
      return handleSummary(receipts);
    default:
      // Fallback: try a fuzzy search on the raw text.
      if (receipts.length === 0) return "You don't have any receipts yet. Try uploading one first.";
      return handleSearch({ type: 'search', query: userText }, receipts);
  }
}
