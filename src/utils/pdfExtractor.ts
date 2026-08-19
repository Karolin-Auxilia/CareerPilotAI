import * as pdfjsLib from 'pdfjs-dist';

// Configure worker using unpkg / cdnjs or local build fallback
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export async function extractTextFromPdf(file: File | ArrayBuffer): Promise<string> {
  try {
    const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += pageText + '\n\n';
    }

    const cleaned = fullText.trim();
    if (cleaned.length > 0) {
      return cleaned;
    }
  } catch (err) {
    console.warn('pdfjs-dist primary parse error, falling back to raw buffer scan:', err);
  }

  // Raw byte stream text scanner fallback if worker fails
  return rawPdfTextScan(file);
}

async function rawPdfTextScan(file: File | ArrayBuffer): Promise<string> {
  try {
    const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
    const uint8 = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const raw = decoder.decode(uint8);

    // Extract text blocks inside parentheses (PDF standard string encoding)
    const matches = raw.match(/\(([^()]+)\)/g);
    if (matches && matches.length > 0) {
      const extracted = matches
        .map((m) => m.slice(1, -1))
        .filter((s) => s.length > 2 && /[a-zA-Z]/.test(s))
        .join(' ');
      if (extracted.trim().length > 30) {
        return extracted;
      }
    }
  } catch (e) {
    console.error('Raw PDF scan failed:', e);
  }
  return '';
}
