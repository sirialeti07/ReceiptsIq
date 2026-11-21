import { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  UploadCloud,
  ImageIcon,
  Loader2,
  Wand2,
  Save,
  AlertCircle,
  Trash2,
  Check,
  FileText,
} from 'lucide-react';
import { runOcr, fileToDataUrl, isAcceptedFile, type OcrProgress } from '@/lib/ocr';
import { parseReceiptText } from '@/lib/receiptParser';
import type { ReceiptInput } from '@/types/receipt';

interface Props {
  onClose: () => void;
  onSave: (input: ReceiptInput) => Promise<void>;
}

type Stage = 'idle' | 'ocr' | 'review' | 'saving';

export function InjectReceiptModal({ onClose, onSave }: Props) {
  const [stage, setStage] = useState<Stage>('idle');
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ReceiptInput | null>(null);
  const [manualPaste, setManualPaste] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleFile = useCallback(async (f: File) => {
    if (!isAcceptedFile(f)) {
      setError('Unsupported file type. Please upload a JPG, PNG, WEBP or PDF.');
      return;
    }
    setError(null);
    setFile(f);
    setOcrText('');
    setParsed(null);
    setStage('ocr');
    try {
      // Preview for images (PDFs won't render as image — show a file chip instead).
      if (f.type.startsWith('image/')) {
        const url = await fileToDataUrl(f);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
      const text = await runOcr(f, (p) => setOcrProgress(p));
      setOcrText(text);
      setManualPaste(text);
      setParsed(parseReceiptText(text));
      setStage('review');
    } catch {
      setError('OCR failed to process this image. You can paste the receipt text manually below.');
      setStage('review');
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleReparse = () => {
    const text = manualPaste.trim();
    if (!text) {
      setError('Paste some receipt text first, then re-parse.');
      return;
    }
    setError(null);
    setParsed(parseReceiptText(text));
  };

  const handleSave = async () => {
    if (!parsed) {
      setError('Nothing to save yet — upload an image or paste text and parse it.');
      return;
    }
    setStage('saving');
    try {
      await onSave({ ...parsed, ocr_raw_text: manualPaste || ocrText || parsed.ocr_raw_text });
      onClose();
    } catch {
      setError('Could not save the receipt. Please try again.');
      setStage('review');
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setOcrText('');
    setManualPaste('');
    setParsed(null);
    setError(null);
    setStage('idle');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F172A]/40 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-3.5 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#DC2626] to-[#B45309] text-white">
              <Wand2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Inject Receipt</h2>
              <p className="text-[11px] text-slate-500">Upload an image or paste text — our OCR agent parses it</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0F172A]"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Dropzone / upload */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={[
              'relative rounded-2xl border-2 border-dashed p-6 text-center transition-colors',
              dragging
                ? 'border-[#DC2626] bg-[#FEF2F2]'
                : previewUrl
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-slate-300 bg-slate-50 hover:border-[#DC2626]/50 hover:bg-[#FEF2F2]/40',
            ].join(' ')}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />

            {previewUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="h-24 w-20 rounded-lg border border-slate-200 object-cover"
                />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-[#0F172A]">{file?.name}</p>
                  <p className="text-xs text-slate-500">
                    {file && (file.size / 1024).toFixed(0)} KB · Image uploaded
                  </p>
                  <button
                    onClick={reset}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove & re-upload
                  </button>
                </div>
              </div>
            ) : file && file.type === 'application/pdf' ? (
              <div className="flex items-center gap-4">
                <div className="grid h-24 w-20 place-items-center rounded-lg border border-slate-200 bg-white">
                  <FileText className="h-7 w-7 text-[#DC2626]" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-[#0F172A]">{file.name}</p>
                  <p className="text-xs text-slate-500">PDF document</p>
                  <button onClick={reset} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:underline">
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-sm">
                  <UploadCloud className="h-6 w-6 text-[#4F46E5]" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">Drag & drop your receipt here</p>
                  <p className="mt-1 text-xs text-slate-500">or choose an image from your device</p>
                </div>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#4338CA] active:scale-[0.98]"
                >
                  <UploadCloud className="h-4 w-4" />
                  Upload from device
                </button>
                <p className="text-[11px] text-slate-400">JPG, PNG, WEBP or PDF · sent to OCR Agent</p>
              </div>
            )}
          </div>

          {/* OCR progress */}
          {stage === 'ocr' && (
            <div className="flex items-center gap-3 rounded-xl bg-[#F0F9FF] px-4 py-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#0369A1]" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#0369A1]">
                  OCR Agent reading your receipt…
                </p>
                <p className="text-xs text-[#0369A1]/70 capitalize">
                  {ocrProgress?.status ?? 'starting'} · {Math.round((ocrProgress?.progress ?? 0) * 100)}%
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
              <p className="text-xs font-medium text-[#DC2626]">{error}</p>
            </div>
          )}

          {/* Paste / editable OCR text */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                <ImageIcon className="h-3.5 w-3.5" />
                Paste Receipt OCR Output or Text
              </label>
              {parsed && stage === 'review' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#047857]">
                  <Check className="h-3.5 w-3.5" />
                  Parsed
                </span>
              )}
            </div>
            <textarea
              value={manualPaste}
              onChange={(e) => {
                setManualPaste(e.target.value);
                setParsed(null);
              }}
              placeholder="Paste raw receipt text here as a fallback…"
              rows={5}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3.5 font-mono text-xs leading-relaxed text-slate-700 outline-none transition-colors focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15"
            />
            <button
              onClick={handleReparse}
              disabled={!manualPaste.trim() || stage === 'ocr'}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-[#0F172A] transition-colors hover:bg-slate-200 disabled:opacity-40"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Re-parse text
            </button>
            <p className="mt-1.5 text-[11px] text-slate-400">
              The text box is auto-filled from OCR. You can edit it and re-parse anytime.
            </p>
          </div>

          {/* Parsed preview */}
          {parsed && stage === 'review' && (
            <div className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5]/60 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#047857]">
                Parsed Preview — review before saving
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <PreviewField label="Merchant" value={parsed.merchant} />
                <PreviewField label="Date" value={parsed.purchase_date} />
                <PreviewField
                  label="Total"
                  value={new Intl.NumberFormat('en-US', { style: 'currency', currency: parsed.currency ?? 'USD' }).format(parsed.total)}
                />
                <PreviewField label="Items" value={String(parsed.items.length)} />
                <PreviewField label="Category" value={parsed.category ?? '—'} />
                <PreviewField label="Payment" value={parsed.payment_method ?? '—'} />
              </div>
              {parsed.items.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-[#A7F3D0]/60 pt-3">
                  {parsed.items.slice(0, 4).map((it, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-600">
                      <span className="truncate">{it.name}{it.qty > 1 ? ` ×${it.qty}` : ''}</span>
                      <span className="ml-2 shrink-0 tabular-nums">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: parsed.currency ?? 'USD' }).format(it.price)}
                      </span>
                    </div>
                  ))}
                  {parsed.items.length > 4 && (
                    <p className="text-[11px] text-slate-400">+{parsed.items.length - 4} more items</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!parsed || stage === 'saving' || stage === 'ocr'}
              className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-[#0F172A] py-2.5 text-sm font-bold text-white transition-all hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {stage === 'saving' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Parse & Save Receipt
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 truncate font-semibold text-[#0F172A]">{value}</p>
    </div>
  );
}
