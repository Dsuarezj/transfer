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
      let fullText = await this.detailedOCR(processed);
      
      // Si el OCR detallado falló o tiene muy poco texto útil, usar el texto completo
      const hasUsefulContent = fullText && fullText.trim().length > 20 && 
        /(?:comprobante|transferencia|n[úu]mero|banco)/i.test(fullText);
      
      if (!hasUsefulContent) {
        log('   ⚠️ OCR detallado falló o muy poco texto útil, usando OCR completo de la imagen');
        log('   Ejecutando OCR completo en imagen mejorada...');
        fullText = await this.detailedOCR(enhanced);
        
        // Si aún falla, usar quickText
        if (!fullText || fullText.trim().length < 10) {
          log('   Usando texto rápido como último recurso');
          fullText = quickText;
        }
      }
      
      log(`   TEXTO COMPLETO EXTRAÍDO:`);
      log('   ' + '-'.repeat(40));
      fullText.split('\n').forEach((line, i) => {
        if (line.trim()) log(`   ${i + 1}: "${line}"`);
      });
      log('   ' + '-'.repeat(40));

      // 6) Pattern matching - buscar en el texto completo
      log('\n🔍 PASO 6: Pattern matching');
      let number = this.matchPatterns(fullText, bankId || 'generic');
      
      // Si no encontró en texto detallado, intentar también en quickText
      if (!number && fullText !== quickText) {
        log('   Intentando también en texto rápido...');
        number = this.matchPatterns(quickText, bankId || 'generic');
      }

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

    // Normalizar texto para mejor matching - más agresivo para OCR con errores
    let normalizedText = text
      .replace(/\s+/g, ' ')  // Múltiples espacios a uno
      .replace(/[|]/g, 'I')  // | a I (error común de OCR)
      .trim();
    
    log(`   Texto original (primeros 500 chars): "${text.substring(0, 500)}"`);
    
    // Palabras comunes que NO son códigos de comprobante
    const invalidWords = [
      'AHORROS', 'CUENTA', 'CUENTAS', 'ACTIVA', 'AHORRO', 'CORRIENTE',
      'BANCO', 'BANCOS', 'TRANSFERENCIA', 'TRANSFERENCIAS', 'PAGO', 'PAGOS',
      'MONTO', 'COSTO', 'TRANSACCION', 'TRANSACCIONES', 'OPERACION', 'OPERACIONES',
      'ORIGEN', 'DESTINO', 'DESDE', 'PARA', 'FECHA', 'FECHAS', 'NOMBRE', 'NOMBRES',
      'IDENTIFICACION', 'IDENTIFICACIONES', 'COMPROBANTE', 'COMPROBANTES', 'COMPRABANTE',
      'EXITOSO', 'EXITOSA', 'REALIZADO', 'REALIZADA', 'MORALES', 'VILLAVICENCIO',
      'CORONEL', 'MORENO', 'ADOLFO', 'SANTIAGO', 'PAUL', 'ABRAHAN'
    ];
    
    const isInvalidWord = (word: string): boolean => {
      const upperWord = word.toUpperCase();
      return invalidWords.some(invalid => upperWord.includes(invalid) || invalid.includes(upperWord));
    };

    for (const pattern of patterns) {
      try {
        // Probar primero con texto normalizado
        let regex = new RegExp(pattern.regex, 'i');
        let match = normalizedText.match(regex);

        // Si no hay match, probar con texto original (más flexible)
        if (!match) {
          match = text.match(regex);
        }

        if (match) {
          log(`   ✅ MATCH: "${pattern.regex}"`);
          log(`      Captura completa: "${match[0]}"`);
          log(`      Grupo 1 (número): "${match[1] || 'N/A'}"`);
          
          if (match[1]) {
            let result = match[1].trim();
            
            // Filtrar palabras comunes que NO son códigos
            if (isInvalidWord(result)) {
              log(`      ⚠️ Resultado filtrado (palabra común): "${result}"`);
              continue; // Probar siguiente patrón
            }
            
            // Validar que tenga estructura de código (no solo letras comunes)
            // Debe tener al menos un número O tener estructura específica de código
            const hasNumber = /[0-9]/.test(result);
            const isCodeLike = /^[A-Z0-9]{7,12}$/.test(result) && hasNumber;
            
            if (!hasNumber && !isCodeLike) {
              // Si no tiene números y no parece código, probablemente es una palabra común
              log(`      ⚠️ Resultado filtrado (sin números y no parece código): "${result}"`);
              continue;
            }
            
            // Normalizar el resultado: O->0, I->1 en códigos alfanuméricos
            // Si parece un código alfanumérico (tiene letras y números), normalizar
            if (/[A-Za-z].*[0-9]|[0-9].*[A-Za-z]/.test(result)) {
              result = result
                .replace(/O/g, '0')  // O mayúscula a 0
                .replace(/I/g, '1')  // I mayúscula a 1
                .replace(/l/g, '1')  // l minúscula a 1
                .toUpperCase();       // Todo a mayúsculas
            }
            
            pattern.successCount += 1;
            log(`      Resultado normalizado: "${result}"`);
            return result;
          }
        } else {
          log(`   ❌ No match: "${pattern.regex}" (${pattern.description})`);
        }
      } catch (error) {
        log(`   ⚠️ Regex inválido: ${pattern.regex}`);
      }
    }

    // Búsqueda fallback: más flexible para errores de OCR
    log('\n   🔄 Intentando búsqueda fallback de códigos...');
    
    const fallbackPatterns = [
      // Buscar después de "Nro. comprobante:" o "Voucher No.:" (patrón más confiable)
      /(?:nro|n[úu]mero|n[úu]m[3e]ro|voucher\s+no\.?|voucher\s+number)[:\s\.]*(?:de\s+)?(?:comprobante|comprabante|comproban[e3]|comproban[te])[:\s;]*([A-Z0-9]{7,12})/i,
      // Buscar después de "Voucher No.:" o "Voucher Number:" directamente (inglés)
      /(?:voucher\s+no\.?|voucher\s+number)[:\s\.]*([A-Z0-9]{7,12})/i,
      // Buscar después de "comprobante:" o "comprabante:" directamente
      /(?:comprobante|comprabante|comproban[e3]|comproban[te]|voucher)[:\s;]+([A-Z0-9]{7,12})/i,
      // Códigos alfanuméricos con estructura mixta (letras-números-letras-números) cerca de palabras clave
      /(?:comprobante|n[úu]mero|nro)[:\s]*(?:de\s+)?[:\s]*([A-Z0-9]{2,5}[0-9]{2,}[A-Z]{2,3}[A-Z0-9]{2,5})/i,
      // Nro: comprobante/comprabante con código alfanumérico (más flexible)
      /(?:nro|n[úu]mero|n[úu]m[3e]ro)[:\s]*(?:de\s+)?(?:comprobante|comprabante|comproban[e3]|comproban[te])[:\s;]*([A-Z0-9]{7,12})/i,
      // Comprobante/comprabante con código alfanumérico
      /(?:comprobante|comprabante|comproban[e3]|comproban[te])[:\s;]*([A-Z0-9]{7,12})/i,
      // Códigos alfanuméricos con estructura mixta (letras-números-letras-números)
      /\b([A-Z0-9]{2,5}[0-9]{2}[A-Z]{2,3}[A-Z0-9]{2,5})\b/i,
      // Comprobante con errores comunes de OCR (solo números)
      /(?:comprobante|comproban[e3]|comproban[te]|comproban[te]e)[:\s#-]*([0-9]{6,15})/i,
      // Número de comprobante con errores
      /(?:n[úu]mero|n[úu]m[3e]ro|n[úu]m[e3]ro)[:\s]*(?:de\s+)?(?:comprobante|comproban[e3])[:\s]*([0-9]{6,15})/i,
      // Cualquier secuencia de 8-15 dígitos después de "comprobante" o "transferencia"
      /(?:comprobante|transferencia|transf[e3]rencia|voucher)[:\s]*([0-9]{8,15})/i,
    ];

    for (const fallback of fallbackPatterns) {
      // Probar primero en texto original (más información)
      let match = text.match(fallback);
      if (!match) {
        match = normalizedText.match(fallback);
      }
      
      if (match) {
        let found = match[1] || match[0];
        
        // Filtrar palabras comunes
        if (isInvalidWord(found)) {
          log(`   ⚠️ Fallback filtrado (palabra común): "${found}"`);
          continue;
        }
        
        // Validar que tenga números (códigos de comprobante siempre tienen números)
        if (!/[0-9]/.test(found)) {
          log(`   ⚠️ Fallback filtrado (sin números): "${found}"`);
          continue;
        }
        
        // Normalizar código alfanumérico
        if (/[A-Za-z].*[0-9]|[0-9].*[A-Za-z]/.test(found)) {
          found = found
            .replace(/O/g, '0')
            .replace(/I/g, '1')
            .replace(/l/g, '1')
            .toUpperCase();
        }
        
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
