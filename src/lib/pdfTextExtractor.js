const MAX_EXTRACTED_TEXT_LENGTH = 5000;

class FallbackDOMMatrix {
  constructor(init) {
    const values = Array.isArray(init) ? init : [];
    this.a = values[0] ?? 1;
    this.b = values[1] ?? 0;
    this.c = values[2] ?? 0;
    this.d = values[3] ?? 1;
    this.e = values[4] ?? 0;
    this.f = values[5] ?? 0;
  }

  multiply() {
    return this;
  }

  translateSelf() {
    return this;
  }

  scaleSelf() {
    return this;
  }
}

async function ensurePdfJsNodeGlobals() {
  if (
    typeof globalThis.DOMMatrix !== 'undefined' &&
    typeof globalThis.ImageData !== 'undefined' &&
    typeof globalThis.Path2D !== 'undefined'
  ) {
    return;
  }

  try {
    const canvas = await import('@napi-rs/canvas');

    globalThis.DOMMatrix ??= canvas.DOMMatrix;
    globalThis.ImageData ??= canvas.ImageData;
    globalThis.Path2D ??= canvas.Path2D;
  } catch {
    globalThis.DOMMatrix ??= FallbackDOMMatrix;
    globalThis.ImageData ??= class ImageData {};
    globalThis.Path2D ??= class Path2D {};
  }
}

function normalizeTextItems(items) {
  return items
    .map((item) => item.str)
    .filter(Boolean)
    .join(' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export async function extractPdfText(buffer) {
  await ensurePdfJsNodeGlobals();

  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    disableWorker: true,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pages = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent({
        disableCombineTextItems: false,
        includeMarkedContent: false,
      });

      const pageText = normalizeTextItems(content.items);
      if (pageText) {
        pages.push(pageText);
      }
    }
  } finally {
    await pdf.destroy();
  }

  return pages.join('\n').trim().slice(0, MAX_EXTRACTED_TEXT_LENGTH);
}
