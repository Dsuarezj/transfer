export interface PreprocessingConfig {
  contrast: number;
  brightness: number;
  sharpen: boolean;
  threshold: boolean;
  thresholdValue?: number;
}

export interface PatternConfig {
  id: string;
  priority: number;
  contextKeywords: string[];
  numberPattern: string;
  proximity: number;
  position: 'before' | 'after' | 'any';
  separators?: string[];
  examples: string[];
}

export interface ReceiptConfig {
  id: string;
  name: string;
  keywords: string[];
  patterns: PatternConfig[];
  preprocessing: PreprocessingConfig;
}

export interface DetectionResult {
  value: string;
  confidence: number;
  patternId: string;
  source: string;
}
