# Project memory

## Product intent & audience

- ReceiptIQ: receipt-intelligence app that turns paper/email/POS receipts into searchable purchase records and surfaces return/warranty deadlines.
- Audience: consumers who need to retrieve receipts for returns, warranty claims, repairs, or spending reviews.
- Core features: OCR-based receipt ingestion (image upload + paste fallback), parsed receipt storage with deadline tracking, natural-language chatbot for querying receipts, receipt detail view.

## Brand personality & voice

- Utility-focused but polished; positions itself as a smart organizer that removes friction from receipt management.
- UI copy is concise and action-oriented ("Inject Receipt", "Parse & Save Receipt").

## Visual design & UX direction

- Deadline badge color system (user-specified, must be preserved exactly):
  - Critical / Expired: bg #FEF2F2, text #DC2626, border #FECACA — top alert banner and EXPIRED pill.
  - Approaching deadline: bg #FFFBEB, text #B45309 — medium-urgency badges (e.g. "11D LEFT"), KPI highlight for expiring windows.
  - Safe return window: bg #ECFDF5, text #047857 — e.g. "28D LEFT".
  - Active warranty: bg #F0F9FF, text #0369A1 — warranty indicators.
- Typography: Deep Ink Slate #0F172A with `tabular-nums` for all dollar amounts and numbers; Cool Charcoal #475569 for secondary item details.
- Inject Receipt modal: drag-and-drop dropzone + browse button at top with image thumbnail preview, followed by editable paste textbox as fallback.
- Chatbot: floating bottom-right button.
- Home screen: alert banner → KPI cards → searchable/filterable receipt list with deadline badges on each row.
- Inter font loaded via index.html.

## Decisions, constraints & rationale

- Tech stack: vite-react, Tailwind CSS, Lucide React icons (per `.bolt/prompt` constraints).
- Backend: Supabase for receipt persistence; env vars `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- OCR: Tesseract.js (in-browser, no API key, private) chosen over OpenAI Vision / Google Vision to avoid external API dependency.
- Parser output always returns `items` as an array (required, not optional) to simplify downstream code.
- Receipt fields parsed: merchant, date, total, items, category, payment method, plus original OCR source text.
- Five seed receipts (Best Buy, Target, Trader Joe's, Home Depot, CVS) cover every badge state on first load.
- Dataset referenced by user: HuggingFace `rohan-yadav22/cord-v2` (receipt OCR dataset) — not yet integrated into pipeline.

## Open questions & assumptions

- Whether to integrate the HuggingFace cord-v2 dataset into OCR training/evaluation or use it only as reference data.
- Whether OpenAI Vision or Google Vision should replace Tesseract.js for higher accuracy in production.
- Supabase schema/RLS policies assumed to exist; no auth layer implemented yet.
- No image storage strategy beyond local preview — uploaded receipt images are not persisted to Supabase Storage.