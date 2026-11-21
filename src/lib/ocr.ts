import Tesseract from 'tesseract.js';

export interface OcrProgress {
  status: string;
  progress: number;
}

export async function runOcr(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  const { data } = await Tesseract.recognize(file, 'eng', {
    logger: (m: { status: string; progress: number }) => {
      if (onProgress && typeof m.progress === 'number') {
        onProgress({ status: m.status, progress: m.progress });
      }
    },
  });
  return data.text.trim();
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export function isAcceptedFile(file: File): boolean {
  return ACCEPTED.includes(file.type) || /\.(jpe?g|png|pdf|webp)$/i.test(file.name);
}
