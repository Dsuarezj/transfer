import { BankTemplate } from '../types/ocr';

export const DEFAULT_BANK_TEMPLATES: BankTemplate[] = [
  {
    id: 'banco_pichincha',
    name: 'Banco Pichincha',
    keywords: ['PICHINCHA', 'Banco Pichincha'],
    patterns: [
      {
        regex: 'Comprobante[:\\s]+(\\d{5,})',
        priority: 10,
        description: 'Comprobante: 12345',
        successCount: 0,
      },
      {
        regex: 'N[úu]mero[:\\s]+(\\d{5,})',
        priority: 9,
        description: 'Número: 12345',
        successCount: 0,
      },
      {
        regex: '\\b(\\d{5,})\\b',
        priority: 5,
        description: 'Cualquier número 5+ dígitos',
        successCount: 0,
      },
    ],
    preprocessing: {
      contrast: 1.2,
      brightness: 10,
      grayscale: true,
    },
    examples: [],
    stats: {
      totalAttempts: 0,
      successfulDetections: 0,
      lastUpdated: '2025-12-31T00:00:00Z',
    },
  },
  {
    id: 'generic',
    name: 'Genérico',
    keywords: [],
    patterns: [
      {
        regex: '(?:Comprobante|N[úu]mero|Operaci[óo]n)[:\\s-]+(\\d{4,})',
        priority: 8,
        description: 'Keywords comunes + número',
        successCount: 0,
      },
    ],
    preprocessing: {
      contrast: 1.1,
      brightness: 5,
      grayscale: true,
    },
    examples: [],
    stats: {
      totalAttempts: 0,
      successfulDetections: 0,
      lastUpdated: '2025-12-31T00:00:00Z',
    },
  },
];

export interface BankTemplatesFile {
  version: string;
  banks: BankTemplate[];
}

