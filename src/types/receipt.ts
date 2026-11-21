export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
}

export type DeadlineStatus = 'expired' | 'critical' | 'warning' | 'safe' | 'warranty';

export interface Receipt {
  id: string;
  merchant: string;
  purchase_date: string;
  total: number;
  currency: string;
  items: ReceiptItem[];
  category: string | null;
  payment_method: string | null;
  ocr_raw_text: string | null;
  image_url: string | null;
  return_window_days: number;
  warranty_window_days: number;
  return_deadline: string | null;
  warranty_deadline: string | null;
  notes: string | null;
  created_at: string;
}

export interface ReceiptInput {
  merchant: string;
  purchase_date: string;
  total: number;
  currency?: string;
  items: ReceiptItem[];
  category?: string | null;
  payment_method?: string | null;
  ocr_raw_text?: string | null;
  image_url?: string | null;
  return_window_days?: number;
  warranty_window_days?: number;
  notes?: string | null;
}
