import Tesseract from 'tesseract.js';
import { getConfigForReceipt } from '../config/receipts';
import { preprocessImage } from './imagePreprocessor';
import { findPatternMatches } from './patternMatcher';
import { DetectionResult } from '../types/receipt';

export async function extractTransferNumber(imageBlob: Blob): Promise<string | null> {
  try {
    const imageDataUrl = await blobToDataURL(imageBlob);

    const initialResult = await Tesseract.recognize(imageBlob, 'spa', {
      logger: () => {},
    });

    const initialText = initialResult.data.text;
    const config = getConfigForReceipt(initialText);

    const processedImage = await preprocessImage(imageDataUrl, config.preprocessing);
    const processedBlob = await dataURLToBlob(processedImage);

    const result = await Tesseract.recognize(processedBlob, 'spa', {
      logger: () => {},
    });

    const words = result.data.words.map(word => ({
      text: word.text,
      x: word.bbox.x0,
      y: word.bbox.y0,
      width: word.bbox.x1 - word.bbox.x0,
      height: word.bbox.y1 - word.bbox.y0
    }));

    const sortedPatterns = [...config.patterns].sort((a, b) => a.priority - b.priority);

    let bestMatch: DetectionResult | null = null;

    for (const pattern of sortedPatterns) {
      const match = findPatternMatches(words, pattern);
      if (match && (!bestMatch || match.confidence > bestMatch.confidence)) {
        bestMatch = match;
      }
    }

    if (bestMatch && bestMatch.confidence > 0.2) {
      return bestMatch.value;
    }

    const text = result.data.text;
    const fallbackPatterns = [
      /comprobante[:\s]+([A-Z0-9]{7,10})/i,
      /nro[.\s:]+comprobante[:\s]+([A-Z0-9]{7,10})/i,
      /([A-Z]{2,4}\d{2}[A-Z0-9]{4,6})/,
      /(\d{7,8})/
    ];

    for (const pattern of fallbackPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error('OCR Error:', error);
    return null;
  }
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataURLToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then(res => res.blob());
}
