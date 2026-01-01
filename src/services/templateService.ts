import banksData from '../config/banksData.json';
import { BankPattern, BankTemplate } from '../types/ocr';

const USER_PATTERNS_KEY = 'user_patterns';

export class TemplateService {
  private templates: Map<string, BankTemplate> = new Map();
  private userPatterns: Map<string, BankPattern[]> = new Map();

  constructor() {
    this.loadTemplates();
    this.loadUserPatterns();
  }

  private loadTemplates(): void {
    banksData.banks.forEach((bank) => {
      this.templates.set(bank.id, bank);
    });
  }

  private loadUserPatterns(): void {
    try {
      const stored = localStorage.getItem(USER_PATTERNS_KEY);
      if (stored) {
        this.userPatterns = new Map(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('No se pudieron cargar patrones de usuario', error);
      this.userPatterns = new Map();
    }
  }

  private persistUserPatterns(): void {
    try {
      localStorage.setItem(USER_PATTERNS_KEY, JSON.stringify(Array.from(this.userPatterns.entries())));
    } catch (error) {
      console.warn('No se pudieron guardar patrones de usuario', error);
    }
  }

  getTemplate(bankId: string): BankTemplate | null {
    return this.templates.get(bankId) || this.templates.get('generic') || null;
  }

  detectBank(text: string): string | null {
    const normalizedText = text.toUpperCase()
      .replace(/[|Il1]/g, 'I')  // Normalizar caracteres similares
      .replace(/[0O]/g, 'O')
      .replace(/\s+/g, ' ');

    for (const [id, template] of this.templates) {
      if (id === 'generic') continue;

      // Buscar keywords exactos
      const hasExactKeyword = template.keywords.some((keyword) => 
        normalizedText.includes(keyword.toUpperCase())
      );
      
      if (hasExactKeyword) return id;

      // Búsqueda flexible para errores comunes de OCR
      // Ej: "py CHINCHA" -> "PICHINCHA", "BANCO py CHINCHA" -> "BANCO PICHINCHA"
      const flexiblePatterns: Record<string, RegExp[]> = {
        banco_pichincha: [
          /(?:BANCO\s+)?(?:py|p[yi]|p[yi]y|p[yi]y)\s*CHINCHA/i,
          /(?:BANCO\s+)?P[yi]CHINCHA/i,
          /CHINCHA/i,
        ],
        banco_guayaquil: [
          /(?:BANCO\s+)?GUAYAQU[il1]L/i,
          /GUAYAQU[il1]L/i,
        ],
        banco_pacifico: [
          /(?:BANCO\s+)?(?:DEL\s+)?PAC[il1]F[il1]CO/i,
          /PAC[il1]F[il1]CO/i,
        ],
        produbanco: [
          /PRODUBANCO/i,
          /PRODU\s*BANCO/i,
        ],
        banco_de_loja: [
          /(?:BANCO\s+)?(?:DE\s+)?LO[IJ]A/i,
          /[A-Z\s]*BANCO\s+DE\s+LO[A-Z\s]*/i,  // "E BANCO DE LO e" (con caracteres alrededor)
          /BANCO\s+DE\s+LO/i,  // "BANCO DE LO" (incompleto por OCR)
          /LO[IJ]A/i,
          /ahorita[!]?/i,
          /AHORITA[!]?/i,
        ],
      };

      const patterns = flexiblePatterns[id];
      if (patterns && patterns.some(pattern => pattern.test(normalizedText))) {
        return id;
      }
    }

    return 'generic';
  }

  async addPattern(bankId: string, pattern: BankPattern): Promise<void> {
    const current = this.userPatterns.get(bankId) || [];
    current.push(pattern);
    this.userPatterns.set(bankId, current);
    this.persistUserPatterns();
    console.log(`Nuevo pattern aprendido para ${bankId}:`, pattern.regex);
  }

  getAllPatterns(bankId: string): BankPattern[] {
    const template = this.getTemplate(bankId);
    const basePatterns = template?.patterns || [];
    const userPatterns = this.userPatterns.get(bankId) || [];

    return [...basePatterns, ...userPatterns].sort((a, b) => b.priority - a.priority);
  }

  updateStats(bankId: string, success: boolean): void {
    const template = this.getTemplate(bankId);
    if (!template) return;

    template.stats.totalAttempts += 1;
    if (success) template.stats.successfulDetections += 1;
    template.stats.lastUpdated = new Date().toISOString();

    try {
      localStorage.setItem(`stats_${bankId}`, JSON.stringify(template.stats));
    } catch (error) {
      console.warn('No se pudieron guardar estadísticas', error);
    }
  }
}

export const templateService = new TemplateService();

