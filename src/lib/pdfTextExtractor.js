const MAX_EXTRACTED_TEXT_LENGTH = 12_000;

let pdfJsNodeGlobalsReady;

async function ensurePdfJsNodeGlobals() {
  if (pdfJsNodeGlobalsReady) {
    return pdfJsNodeGlobalsReady;
  }

  pdfJsNodeGlobalsReady = (async () => {
    const canvas = await import('@napi-rs/canvas');

    const globals = {
      DOMMatrix: canvas.DOMMatrix,
      DOMPoint: canvas.DOMPoint,
      DOMRect: canvas.DOMRect,
      ImageData: canvas.ImageData,
      Path2D: canvas.Path2D,
    };

    for (const [name, value] of Object.entries(globals)) {
      if (typeof globalThis[name] === 'undefined' && value) {
        globalThis[name] = value;
      }
    }
  })();

  return pdfJsNodeGlobalsReady;
}

function normalizeTextItems(items) {
  return items
    .map((item) => ('str' in item ? item.str : ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function extractPdfText(buffer) {
  if (!buffer || buffer.length === 0) {
    return '';
  }

  await ensurePdfJsNodeGlobals();

  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    disableFontFace: true,
    isEvalSupported: false,
    isImageDecoderSupported: false,
    isOffscreenCanvasSupported: false,
    useSystemFonts: true,
    useWorkerFetch: false,
  });

  const pdf = await loadingTask.promise;
  const pages = [];
  let extractedLength = 0;

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
        extractedLength += pageText.length + 1;
      }

      page.cleanup();

      if (extractedLength >= MAX_EXTRACTED_TEXT_LENGTH) {
        break;
      }
    }
  } finally {
    await pdf.destroy();
  }

  return pages.join('\n').trim().slice(0, MAX_EXTRACTED_TEXT_LENGTH);
}
