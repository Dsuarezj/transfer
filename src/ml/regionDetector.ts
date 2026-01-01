import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import { BoundingBox } from '../types/ocr';
import { blobToImage } from '../utils/imagePreprocessing';

const MODEL_VERSION_URL = '/models/v1/model-version.json';
const MODEL_URL = '/models/v1/model.json';
const MODEL_CACHE_KEY = 'custom_model_cache';
const MODEL_VERSION_KEY = 'custom_model_version';

const INPUT_SIZE = 320; // Tamaño de entrada del modelo custom

type DetectionModel =
  | { kind: 'coco'; model: cocoSsd.ObjectDetection }
  | { kind: 'layers'; model: tf.LayersModel };

export class RegionDetector {
  private static detectionModel: DetectionModel | null = null;

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private async loadCoco(): Promise<DetectionModel> {
    console.log('[RegionDetector] Cargando COCO-SSD (fallback)...');
    const model = await cocoSsd.load();
    console.log('[RegionDetector] COCO-SSD cargado.');
    return { kind: 'coco', model };
  }

  private async loadCachedLayers(): Promise<tf.LayersModel | null> {
    if (!this.isBrowser()) return null;
    try {
      console.log('[RegionDetector] Intentando cargar modelo desde IndexedDB...');
      const model = await tf.loadLayersModel(`indexeddb://${MODEL_CACHE_KEY}`);
      console.log('[RegionDetector] Modelo cargado desde IndexedDB.');
      return model;
    } catch {
      return null;
    }
  }

  private async loadRemoteLayers(): Promise<tf.LayersModel | null> {
    if (!this.isBrowser()) return null;

    // Obtener versión remota
    let remoteVersion: string | null = null;
    try {
      const resp = await fetch(MODEL_VERSION_URL, { cache: 'no-cache' });
      const json = await resp.json();
      remoteVersion = json?.version ?? null;
      console.log(`[RegionDetector] Versión remota del modelo: ${remoteVersion}`);
    } catch {
      console.log('[RegionDetector] No se pudo obtener versión del modelo.');
      return null;
    }

    const localVersion = localStorage.getItem(MODEL_VERSION_KEY);
    
    // Si la versión coincide, usar cache
    if (remoteVersion === localVersion) {
      const cached = await this.loadCachedLayers();
      if (cached) return cached;
    }

    // Descargar modelo
    try {
      console.log(`[RegionDetector] Descargando modelo custom v${remoteVersion}...`);
      const model = await tf.loadLayersModel(MODEL_URL);
      
      // Cachear en IndexedDB
      if (remoteVersion) {
        await model.save(`indexeddb://${MODEL_CACHE_KEY}`);
        localStorage.setItem(MODEL_VERSION_KEY, remoteVersion);
        console.log('[RegionDetector] Modelo cacheado en IndexedDB.');
      }
      
      return model;
    } catch (err) {
      console.warn('[RegionDetector] Error descargando modelo:', err);
      return null;
    }
  }

  private async ensureModel(): Promise<void> {
    if (RegionDetector.detectionModel) return;

    // 1) Intentar modelo custom (layers)
    const layers = await this.loadRemoteLayers();
    if (layers) {
      RegionDetector.detectionModel = { kind: 'layers', model: layers };
      console.log('[RegionDetector] ✓ Usando modelo custom entrenado.');
      return;
    }

    // 2) Fallback a COCO-SSD
    RegionDetector.detectionModel = await this.loadCoco();
    console.log('[RegionDetector] Usando COCO-SSD como fallback.');
  }

  /**
   * Pre-carga el modelo para evitar latencia en la primera detección.
   */
  async preload(): Promise<void> {
    await this.ensureModel();
  }

  async detectNumberRegion(imageBlob: Blob): Promise<BoundingBox | null> {
    await this.ensureModel();
    if (!RegionDetector.detectionModel) return null;

    const img = await blobToImage(imageBlob);

    if (RegionDetector.detectionModel.kind === 'layers') {
      // Modelo custom: predice bbox normalizado [ymin, xmin, ymax, xmax]
      try {
        const tensor = tf.browser.fromPixels(img)
          .toFloat()
          .div(255.0)  // Normalizar a [0, 1]
          .resizeBilinear([INPUT_SIZE, INPUT_SIZE])
          .expandDims(0);

        const prediction = RegionDetector.detectionModel.model.predict(tensor) as tf.Tensor;
        const bboxNorm = await prediction.array() as number[][];
        
        tensor.dispose();
        prediction.dispose();

        // bboxNorm[0] = [ymin, xmin, ymax, xmax] normalizado
        const [ymin, xmin, ymax, xmax] = bboxNorm[0];
        
        // Calcular dimensiones
        let x = xmin * img.width;
        let y = ymin * img.height;
        let width = (xmax - xmin) * img.width;
        let height = (ymax - ymin) * img.height;

        // Validar y sanitizar coordenadas
        if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) {
          console.warn('[RegionDetector] Coordenadas inválidas del modelo, usando región por defecto');
          return this.getDefaultRegion(img.width, img.height);
        }

        // Asegurar que las coordenadas estén dentro de la imagen
        x = Math.max(0, Math.min(x, img.width - 10));
        y = Math.max(0, Math.min(y, img.height - 10));
        width = Math.min(width, img.width - x);
        height = Math.min(height, img.height - y);

        const bbox: BoundingBox = { x, y, width, height };

        console.log('[RegionDetector] Región detectada:', bbox);
        return bbox;
        
      } catch (err) {
        console.warn('[RegionDetector] Error ejecutando modelo custom:', err);
        // Fallback a región superior
        return this.getDefaultRegion(img.width, img.height);
      }
    }

    // COCO-SSD
    const predictions = await RegionDetector.detectionModel.model.detect(img);
    return this.findBestTextRegion(
      predictions.map(p => ({
        bbox: p.bbox as [number, number, number, number],
        score: p.score,
      })),
      img.width,
      img.height
    );
  }

  private getDefaultRegion(width: number, height: number): BoundingBox {
    // Por defecto, tercio superior de la imagen
    return {
      x: 0,
      y: 0,
      width: width,
      height: Math.round(height / 3),
    };
  }

  private findBestTextRegion(
    predictions: { bbox: [number, number, number, number]; score?: number }[],
    imageWidth: number,
    imageHeight: number
  ): BoundingBox | null {
    if (!predictions.length) {
      return this.getDefaultRegion(imageWidth, imageHeight);
    }

    // Priorizar detecciones en el tercio superior
    const topThird = predictions.filter((p) => {
      const centerY = p.bbox[1] + p.bbox[3] / 2;
      return centerY < imageHeight / 3;
    });

    const candidate = (topThird.length ? topThird : predictions)
      .sort((a, b) => (b.score || 0) - (a.score || 0))[0];

    if (!candidate) {
      return this.getDefaultRegion(imageWidth, imageHeight);
    }

    return {
      x: candidate.bbox[0],
      y: candidate.bbox[1],
      width: candidate.bbox[2],
      height: candidate.bbox[3],
    };
  }
}

export const regionDetectorSingleton = new RegionDetector();
