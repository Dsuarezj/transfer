import Tesseract from 'tesseract.js';
import { regionDetectorSingleton } from '../ml/regionDetector';
import { templateService } from '../services/templateService';
import { enhanceImage, cropToRegion } from './imagePreprocessing';
import { BankTemplate, OCRResult } from '../types/ocr';

const ENABLE_OCR_LOGS = true;

function log(...args: unknown[]) {
  if (ENABLE_OCR_LOGS) console.log('[OCR]', ...args);
}

export class OCREngine {
  constructor() {
  }

  async extractTransferNumber(imageBlob: Blob): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      log('Iniciando OCR: preprocesamiento');
      // 1) Pre-procesamiento base
      const enhanced = await enhanceImage(imageBlob);

      log('OCR rápido para detectar banco');
      // 2) OCR rápido para identificar banco
      const quickText = await this.quickOCR(enhanced);
      const bankId = templateService.detectBank(quickText);
      const template = templateService.getTemplate(bankId || 'generic');

      log('Detección de región con modelo (custom o COCO fallback)');
      // 3) Detección de región con TensorFlow (heurística de posición)
      const region = await regionDetectorSingleton.detectNumberRegion(enhanced);

      log('Recorte y ajustes específicos del banco');
      // 4) Recorte y ajustes específicos del banco
      const cropped = region ? await cropToRegion(enhanced, region) : enhanced;
      const processed = await this.applyBankPreprocessing(cropped, template);

      log('OCR detallado multi-pasada');
      // 5) OCR detallado con múltiples pasadas
      const fullText = await this.detailedOCR(processed);

      log('Pattern matching');
      // 6) Pattern matching ordenado por prioridad
      const number = this.matchPatterns(fullText, bankId || 'generic');

      // 7) Confianza heurística
      const confidence = this.calculateConfidence(number, fullText, template);

      // 8) Actualizar estadísticas
      templateService.updateStats(bankId || 'generic', number !== null);

      log('Resultado', { number, confidence, bankId, region });

      return {
        number,
        confidence,
        bankDetected: bankId,
        region,
        rawText: fullText,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[OCR] Error:', error);
      return {
        number: null,
        confidence: 0,
        bankDetected: null,
        region: null,
        rawText: '',
        processingTime: Date.now() - startTime,
      };
    }
  }

  private async quickOCR(blob: Blob): Promise<string> {
    const result = await Tesseract.recognize(blob, 'spa', { logger: () => {} });
    return result.data.text;
  }

  private async detailedOCR(blob: Blob): Promise<string> {
    const configs = [
      { psm: Tesseract.PSM.SINGLE_LINE },
      { psm: Tesseract.PSM.SINGLE_BLOCK },
    ];

    const results = await Promise.all(
      configs.map((config) =>
        Tesseract.recognize(blob, 'spa', {
          logger: () => {},
          ...config,
        })
      )
    );

    return results
      .map((r) => r.data.text)
      .sort((a, b) => b.length - a.length)[0];
  }

  private async applyBankPreprocessing(blob: Blob, template: BankTemplate | null): Promise<Blob> {
    if (!template) return blob;
    return enhanceImage(blob, template.preprocessing);
  }

  private matchPatterns(text: string, bankId: string): string | null {
    const patterns = templateService.getAllPatterns(bankId);

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.regex, 'i');
        const match = text.match(regex);

        if (match && match[1]) {
          pattern.successCount += 1;
          return match[1].trim();
        }
      } catch (error) {
        console.warn(`Regex inválido: ${pattern.regex}`, error);
      }
    }

    return null;
  }

  private calculateConfidence(number: string | null, text: string, template: BankTemplate | null): number {
    if (!number) return 0;

    let confidence = 50;

    if (/(?:comprobante|número|operación)/i.test(text)) confidence += 20;
    if (template && template.id !== 'generic') confidence += 15;
    if (number.length >= 5 && number.length <= 15) confidence += 15;

    return Math.min(confidence, 100);
  }
}

// Función de compatibilidad con el flujo actual
export async function extractTransferNumber(imageBlob: Blob): Promise<string | null> {
  const engine = new OCREngine();
  const result = await engine.extractTransferNumber(imageBlob);
  return result.number;
}
