import Tesseract from 'tesseract.js';
import { regionDetectorSingleton } from '../ml/regionDetector';
import { templateService } from '../services/templateService';
import { enhanceImage, cropToRegion } from './imagePreprocessing';
import { BankTemplate, OCRResult } from '../types/ocr';

const ENABLE_OCR_LOGS = true;

function log(...args: unknown[]) {
  if (ENABLE_OCR_LOGS) console.log('[OCR]', ...args);
}

function logSection(title: string) {
  if (ENABLE_OCR_LOGS) {
    console.log('\n' + '='.repeat(50));
    console.log(`[OCR] ${title}`);
    console.log('='.repeat(50));
  }
}

export class OCREngine {
  constructor() {}

  async extractTransferNumber(imageBlob: Blob): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      logSection('INICIANDO EXTRACCIÓN DE NÚMERO DE TRANSFERENCIA');
      log(`Tamaño de imagen: ${(imageBlob.size / 1024).toFixed(1)} KB`);

      // 1) Pre-procesamiento base
      log('\n📷 PASO 1: Pre-procesamiento de imagen');
      const enhanced = await enhanceImage(imageBlob);
      log(`   Imagen mejorada: ${(enhanced.size / 1024).toFixed(1)} KB`);

      // 2) OCR rápido para identificar banco
      log('\n🏦 PASO 2: OCR rápido para detectar banco');
      const quickText = await this.quickOCR(enhanced);
      log(`   Texto extraído (primeros 200 chars):`);
      log(`   "${quickText.substring(0, 200).replace(/\n/g, ' ')}..."`);
      
      const bankId = templateService.detectBank(quickText);
      const template = templateService.getTemplate(bankId || 'generic');
      log(`   Banco detectado: ${bankId || 'ninguno (usando genérico)'}`);
      if (template) {
        log(`   Template: ${template.name}`);
        log(`   Keywords: ${template.keywords.join(', ')}`);
      }

      // 3) Detección de región con TensorFlow
      log('\n🎯 PASO 3: Detección de región con modelo ML');
      const region = await regionDetectorSingleton.detectNumberRegion(enhanced);
      if (region) {
        log(`   Región detectada: x=${region.x.toFixed(0)}, y=${region.y.toFixed(0)}, w=${region.width.toFixed(0)}, h=${region.height.toFixed(0)}`);
      } else {
        log(`   ⚠️ No se detectó región específica, usando imagen completa`);
      }

      // 4) Recorte y ajustes específicos del banco
      log('\n✂️ PASO 4: Recorte y pre-procesamiento específico');
      const cropped = region ? await cropToRegion(enhanced, region) : enhanced;
      log(`   Imagen recortada: ${(cropped.size / 1024).toFixed(1)} KB`);
      const processed = await this.applyBankPreprocessing(cropped, template);

      // 5) OCR detallado
      log('\n📖 PASO 5: OCR detallado (multi-pasada)');
      const fullText = await this.detailedOCR(processed);
      log(`   TEXTO COMPLETO EXTRAÍDO:`);
      log('   ' + '-'.repeat(40));
      fullText.split('\n').forEach((line, i) => {
        if (line.trim()) log(`   ${i + 1}: "${line}"`);
      });
      log('   ' + '-'.repeat(40));

      // 6) Pattern matching
      log('\n🔍 PASO 6: Pattern matching');
      const number = this.matchPatterns(fullText, bankId || 'generic');

      // 7) Confianza heurística
      const confidence = this.calculateConfidence(number, fullText, template);

      // 8) Actualizar estadísticas
      templateService.updateStats(bankId || 'generic', number !== null);

      logSection('RESULTADO FINAL');
      log(`   Número encontrado: ${number || '❌ NO DETECTADO'}`);
      log(`   Confianza: ${confidence}%`);
      log(`   Banco: ${bankId || 'genérico'}`);
      log(`   Tiempo: ${Date.now() - startTime}ms`);

      if (!number) {
        log('\n⚠️ SUGERENCIAS DE DEBUG:');
        log('   1. Verifica si el número aparece en el "TEXTO COMPLETO EXTRAÍDO"');
        log('   2. Si aparece, el patrón regex no lo está capturando');
        log('   3. Si no aparece, el OCR no lo está leyendo correctamente');
        log('   4. Prueba con mejor iluminación o enfoque en la foto');
      }

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
    log('   Ejecutando OCR con múltiples configuraciones...');
    
    const configs = [
      { psm: Tesseract.PSM.SINGLE_LINE, name: 'SINGLE_LINE' },
      { psm: Tesseract.PSM.SINGLE_BLOCK, name: 'SINGLE_BLOCK' },
    ];

    const results: { text: string; config: string; length: number }[] = [];

    for (const config of configs) {
      try {
        const result = await Tesseract.recognize(blob, 'spa', {
          logger: () => {},
          ...config,
        });
        results.push({
          text: result.data.text,
          config: config.name,
          length: result.data.text.length,
        });
        log(`   - ${config.name}: ${result.data.text.length} caracteres`);
      } catch (e) {
        log(`   - ${config.name}: ERROR`);
      }
    }

    // Devolver el resultado más largo
    const best = results.sort((a, b) => b.length - a.length)[0];
    log(`   Mejor resultado: ${best?.config || 'ninguno'}`);
    
    return best?.text || '';
  }

  private async applyBankPreprocessing(blob: Blob, template: BankTemplate | null): Promise<Blob> {
    if (!template) return blob;
    log(`   Aplicando pre-procesamiento: contrast=${template.preprocessing.contrast}, brightness=${template.preprocessing.brightness}`);
    return enhanceImage(blob, template.preprocessing);
  }

  private matchPatterns(text: string, bankId: string): string | null {
    const patterns = templateService.getAllPatterns(bankId);
    log(`   Probando ${patterns.length} patrones para "${bankId}":`);

    // Normalizar texto para mejor matching
    const normalizedText = text.replace(/\s+/g, ' ').trim();

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.regex, 'i');
        const match = normalizedText.match(regex);

        if (match) {
          log(`   ✅ MATCH: "${pattern.regex}"`);
          log(`      Captura completa: "${match[0]}"`);
          log(`      Grupo 1 (número): "${match[1] || 'N/A'}"`);
          
          if (match[1]) {
            pattern.successCount += 1;
            return match[1].trim();
          }
        } else {
          log(`   ❌ No match: "${pattern.regex}" (${pattern.description})`);
        }
      } catch (error) {
        log(`   ⚠️ Regex inválido: ${pattern.regex}`);
      }
    }

    // Búsqueda fallback: cualquier secuencia de números/letras que parezca un código
    log('\n   🔄 Intentando búsqueda fallback de códigos...');
    const fallbackPatterns = [
      /(?:comprobante|nro|número|operación|referencia)[:\s#-]*([A-Z0-9]{5,20})/i,
      /(?:CNL|TRF|REF|OP)[A-Z0-9]{5,15}/i,
      /\b([A-Z]{2,3}\d{5,15})\b/,
      /\b(\d{10,20})\b/,
    ];

    for (const fallback of fallbackPatterns) {
      const match = normalizedText.match(fallback);
      if (match) {
        const found = match[1] || match[0];
        log(`   ✅ Fallback encontró: "${found}"`);
        return found;
      }
    }

    log('   ❌ Ningún patrón coincidió');
    return null;
  }

  private calculateConfidence(number: string | null, text: string, template: BankTemplate | null): number {
    if (!number) return 0;

    let confidence = 50;

    if (/(?:comprobante|número|operación|transferencia)/i.test(text)) {
      confidence += 20;
      log(`   +20% por palabras clave encontradas`);
    }
    if (template && template.id !== 'generic') {
      confidence += 15;
      log(`   +15% por banco identificado`);
    }
    if (number.length >= 5 && number.length <= 20) {
      confidence += 15;
      log(`   +15% por longitud válida (${number.length} caracteres)`);
    }

    return Math.min(confidence, 100);
  }
}

// Función de compatibilidad con el flujo actual
export async function extractTransferNumber(imageBlob: Blob): Promise<string | null> {
  const engine = new OCREngine();
  const result = await engine.extractTransferNumber(imageBlob);
  return result.number;
}
