import type { ReceiptInput, ReceiptItem } from '@/types/receipt';

/**
 * Best-effort receipt text parser. Extracts merchant, date, total,
 * items and payment method from raw OCR / pasted text using regex heuristics.
 * Tuned for common retail receipt layouts.
 */

function extractMerchant(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return 'Unknown Merchant';
  // Pick the first line that looks like a name (letters, not a total/line item).
  for (const line of lines.slice(0, 4)) {
    if (/^[A-Z0-9][A-Za-z0-9 &'.\-#/+]{2,}$/.test(line) && !/\$\s?\d/.test(line) && !/total|subtotal|tax|cash|visa|change/i.test(line)) {
      return line.replace(/\s{2,}/g, ' ').trim();
    }
  }
  return lines[0].replace(/\s{2,}/g, ' ').trim();
}

function extractDate(text: string): string | null {
  const patterns = [
    /(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/, // 12/31/2024
    /(\d{4})[./-](\d{1,2})[./-](\d{1,2})/, // 2024-12-31
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      // Normalize to YYYY-MM-DD
      if (m[0].match(/\d{4}[./-]\d{1,2}[./-]\d{1,2}/)) {
        const [y, mo, d] = [m[1], m[2], m[3]].map(Number);
        return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
      if (m[0].match(/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/)) {
        const [, mo, d, y] = m;
        let year = Number(y);
        if (year < 100) year += 2000;
        return `${year}-${String(Number(mo)).padStart(2, '0')}-${String(Number(d)).padStart(2, '0')}`;
      }
      const months: Record<string, number> = {
        jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
        jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
      };
      const mo = months[m[1].toLowerCase().slice(0, 3)];
      const d = Number(m[2]);
      const y = Number(m[3]);
      if (mo) return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return null;
}

function extractTotal(text: string): number | null {
  // Prefer a line that starts with TOTAL / GRAND TOTAL / BALANCE DUE.
  const totalLine = text.match(/(?:grand\s+total|total|balance\s+due|amount\s+due)\s*:?\s*\$?\s*([\d,]+\.\d{2})/i);
  if (totalLine) return parseFloat(totalLine[1].replace(/,/g, ''));
  // Fall back to the largest dollar amount on the receipt.
  const amounts = [...text.matchAll(/\$?\s([\d,]+\.\d{2})/g)]
    .map((m) => parseFloat(m[1].replace(/,/g, '')))
    .filter((n) => !isNaN(n) && n > 0);
  if (amounts.length === 0) return null;
  return Math.max(...amounts);
}

function extractItems(text: string): ReceiptItem[] {
  const items: ReceiptItem[] = [];
  const lines = text.split('\n').map((l) => l.trim());
  // A line item: some text followed by an optional qty and a price at the end.
  for (const line of lines) {
    // Skip header/footer noise.
    if (/^(total|subtotal|tax|cash|change|visa|master|debit|credit|balance|qty|item|description)/i.test(line)) continue;
    const m = line.match(/^(.{2,48}?)\s+(?:x?\s?(\d+)\s+)?\$?(\d+\.\d{2})$/);
    if (m) {
      const name = m[1].trim();
      const qty = m[2] ? parseInt(m[2], 10) : 1;
      const price = parseFloat(m[3]);
      if (price > 0 && name.length > 1) {
        items.push({ name, qty, price });
      }
    }
  }
  return items.slice(0, 40);
}

function extractPaymentMethod(text: string): string | null {
  const m = text.match(/\b(visa|mastercard|master|amex|american express|discover|debit|credit|cash|apple pay|google pay|venmo|paypal)\b/i);
  return m ? m[0].toUpperCase().replace('AMERICAN EXPRESS', 'AMEX') : null;
}

function guessCategory(merchant: string, items: ReceiptItem[]): string | null {
  const blob = (merchant + ' ' + items.map((i) => i.name).join(' ')).toLowerCase();
  const rules: [string, RegExp][] = [
    ['Groceries', /grocery|supermarket|walmart|kroger|aldi|safeway|whole foods|trader joe|costco|publix|aldi/],
    ['Electronics', /electronics|best buy|apple store|b&amp;h|newegg|micro center|gadget|cable|usb|charger|headphone/],
    ['Apparel', /clothing|apparel|fashion|nike|adidas|h&amp;m|zara|gap|uniqlo|shirt|jeans|shoe|dress/],
    ['Dining', /restaurant|cafe|coffee|starbucks|mcdonald|chipotle|pizza|diner|bar|grill|bakery/],
    ['Pharmacy', /pharmacy|cvs|walgreens|rite aid|drug|medicine|prescription/],
    ['Home', /home depot|lowe|ikea|furniture|hardware|garden|decor/],
    ['Fuel', /shell|chevron|exxon|mobil|bp|gas|fuel|station/],
  ];
  for (const [cat, re] of rules) {
    if (re.test(blob)) return cat;
  }
  return null;
}

export function parseReceiptText(rawText: string): ReceiptInput {
  const merchant = extractMerchant(rawText);
  const date = extractDate(rawText) ?? new Date().toISOString().slice(0, 10);
  const total = extractTotal(rawText) ?? 0;
  const items = extractItems(rawText);
  const payment_method = extractPaymentMethod(rawText);
  const category = guessCategory(merchant, items);

  return {
    merchant,
    purchase_date: date,
    total,
    items,
    category,
    payment_method,
    ocr_raw_text: rawText,
  };
}
