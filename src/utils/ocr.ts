import Tesseract from 'tesseract.js';

export async function extractTransferNumber(imageBlob: Blob): Promise<string | null> {
  try {
    const result = await Tesseract.recognize(imageBlob, 'spa', {
      logger: () => {},
    });

    const text = result.data.text;

    const patterns = [
      /(?:N[UÚ]MERO|N[°º]|NUM|#)\s*(?:DE\s+)?(?:OPERACI[OÓ]N|TRANSFERENCIA|REF\.?)\s*[:.\-]?\s*([A-Z0-9\-]+)/i,
      /(?:OPERACI[OÓ]N|TRANSFERENCIA|REF\.?)\s*[:.\-]?\s*([A-Z0-9\-]{6,})/i,
      /\b([0-9]{10,})\b/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  } catch (error) {
    console.error('OCR Error:', error);
    return null;
  }
}
