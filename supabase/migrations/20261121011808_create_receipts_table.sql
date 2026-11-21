/*
# ReceiptIQ: Create receipts table (single-tenant, no auth)

1. New Tables
- `receipts`
  - `id` (uuid, primary key)
  - `merchant` (text, not null) - store/vendor name
  - `purchase_date` (date, not null) - when the purchase was made
  - `total` (numeric(12,2), not null) - total amount paid
  - `currency` (text, default 'USD')
  - `items` (jsonb, default '[]') - array of {name, qty, price}
  - `category` (text) - optional spending category
  - `payment_method` (text) - optional payment method
  - `ocr_raw_text` (text) - the raw text extracted from OCR / pasted
  - `image_url` (text) - optional storage path for uploaded receipt image
  - `return_window_days` (integer, default 30) - return policy window
  - `warranty_window_days` (integer, default 365) - warranty policy window
  - `return_deadline` (date) - computed return deadline
  - `warranty_deadline` (date) - computed warranty deadline
  - `notes` (text) - optional user notes
  - `created_at` (timestamptz, default now())

2. Computed Columns
- `return_deadline` and `warranty_deadline` are computed as generated columns
  based on `purchase_date` + the corresponding window days, so they are always
  consistent with the source data.

3. Security
- Enable RLS on `receipts`.
- Grant CRUD to `anon` + `authenticated` so the no-auth app can reach the table.
- Allow anon + authenticated CRUD because the data is intentionally shared/public
  (single-tenant app, no sign-in screen).
*/

CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant text NOT NULL,
  purchase_date date NOT NULL,
  total numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text,
  payment_method text,
  ocr_raw_text text,
  image_url text,
  return_window_days integer NOT NULL DEFAULT 30,
  warranty_window_days integer NOT NULL DEFAULT 365,
  return_deadline date GENERATED ALWAYS AS (purchase_date + make_interval(days => return_window_days)) STORED,
  warranty_deadline date GENERATED ALWAYS AS (purchase_date + make_interval(days => warranty_window_days)) STORED,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON receipts TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_receipts" ON receipts;
CREATE POLICY "anon_select_receipts" ON receipts FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_receipts" ON receipts;
CREATE POLICY "anon_insert_receipts" ON receipts FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_receipts" ON receipts;
CREATE POLICY "anon_update_receipts" ON receipts FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_receipts" ON receipts;
CREATE POLICY "anon_delete_receipts" ON receipts FOR DELETE
TO anon, authenticated USING (true);
