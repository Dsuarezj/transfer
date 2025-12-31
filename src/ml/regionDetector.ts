import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs'; // ensure backend is registered
import { BoundingBox } from '../types/ocr';
import { blobToImage } from '../utils/imagePreprocessing';

const MODEL_VERSION_URL = '/models/v1/model-version.json';
const MODEL_URL = '/models/v1/model.json';
const MODEL_CACHE_KEY = 'model_cache';
const MODEL_VERSION_KEY = 'model_version';

type DetectionModel =
  | { kind: 'coco'; model: cocoSsd.ObjectDetectionModel }
  | { kind: 'graph'; model: tf.GraphModel };

export class RegionDetector {
  private static detectionModel: DetectionModel | null = null;

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private async loadCoco(): Promise<DetectionModel> {
    const model = await cocoSsd.load();
    return { kind: 'coco', model };
  }

  private async loadCachedGraph(): Promise<tf.GraphModel | null> {
    if (!this.isBrowser()) return null;
    try {
      return await tf.loadGraphModel(`indexeddb://${MODEL_CACHE_KEY}`);
    } catch {
      return null;
    }
  }

  private async loadRemoteGraph(): Promise<tf.GraphModel | null> {
    if (!this.isBrowser()) return null;

    // Obtener versión remota
    let remoteVersion: string | null = null;
    try {
      const resp = await fetch(MODEL_VERSION_URL, { cache: 'no-cache' });
      const json = await resp.json();
      remoteVersion = json?.version ?? null;
    } catch {
      return null; // sin versión, no intentamos
    }

    const localVersion = localStorage.getItem(MODEL_VERSION_KEY);
    // Si la versión remota coincide y tenemos cache, intentamos cache primero
    if (remoteVersion === localVersion) {
      const cached = await this.loadCachedGraph();
      if (cached) return cached;
    }

    // Intentar descargar y cachear
    try {
      const model = await tf.loadGraphModel(MODEL_URL);
      if (remoteVersion) {
        await model.save(`indexeddb://${MODEL_CACHE_KEY}`);
        localStorage.setItem(MODEL_VERSION_KEY, remoteVersion);
      }
      return model;
    } catch {
      return null;
    }
  }

  private async ensureModel(): Promise<void> {
    if (RegionDetector.detectionModel) return;

    // 1) Intentar modelo custom (graph) si existe
    const graph = await this.loadRemoteGraph();
    if (graph) {
      RegionDetector.detectionModel = { kind: 'graph', model: graph };
      return;
    }

    // 2) Fallback a COCO-SSD
    RegionDetector.detectionModel = await this.loadCoco();
  }

  /**
   * Pre-carga el modelo (custom o fallback) para evitar latencia en la primera detección.
   */
  async preload(): Promise<void> {
    await this.ensureModel();
  }

  async detectNumberRegion(imageBlob: Blob): Promise<BoundingBox | null> {
    await this.ensureModel();
    if (!RegionDetector.detectionModel) return null;

    const img = await blobToImage(imageBlob);
    let predictions: { bbox: [number, number, number, number]; score?: number }[] = [];

    if (RegionDetector.detectionModel.kind === 'coco') {
      const result = await RegionDetector.detectionModel.model.detect(img);
      predictions = result.map((p) => ({ bbox: p.bbox as [number, number, number, number], score: p.score }));
    } else {
      // GraphModel: se asume salida estilo TF Object Detection API: detection_boxes, detection_scores
      try {
        const tfImg = tf.browser.fromPixels(img).toFloat().expandDims(0);
        const outputs = (await RegionDetector.detectionModel.model.executeAsync(tfImg)) as tf.Tensor | tf.Tensor[];
        tfImg.dispose();

        if (Array.isArray(outputs) && outputs.length >= 2) {
          const [boxesT, scoresT] = outputs;
          const boxes = boxesT.arraySync() as number[][][];
          const scores = scoresT.arraySync() as number[][];
          const boxesArr = boxes[0] || [];
          const scoresArr = scores[0] || [];

          predictions = boxesArr
            .map((b, i) => {
              const score = scoresArr[i] ?? 0;
              // b = [ymin, xmin, ymax, xmax] normalizado
              const yMin = b[0] * img.height;
              const xMin = b[1] * img.width;
              const yMax = b[2] * img.height;
              const xMax = b[3] * img.width;
              return {
                bbox: [xMin, yMin, xMax - xMin, yMax - yMin] as [number, number, number, number],
                score,
              };
            })
            .filter((p) => (p.score ?? 0) > 0.3);
        }

        // Liberar tensores
        if (Array.isArray(outputs)) outputs.forEach((t) => t.dispose());
        else outputs.dispose();
      } catch (err) {
        console.warn('Fallo al ejecutar modelo custom, usando fallback heurístico', err);
        predictions = [];
      }
    }

    const bestRegion = this.findBestTextRegion(predictions, img.width, img.height);
    return bestRegion;
  }

  private findBestTextRegion(
    predictions: { bbox: [number, number, number, number]; score?: number }[],
    imageWidth: number,
    imageHeight: number
  ): BoundingBox | null {
    if (!predictions.length) {
      return {
        x: 0,
        y: 0,
        width: imageWidth,
        height: Math.round(imageHeight / 3),
      };
    }

    const topThird = predictions.filter((p) => {
      const centerY = p.bbox[1] + p.bbox[3] / 2;
      return centerY < imageHeight / 3;
    });

    const candidate = (topThird.length ? topThird : predictions).sort((a, b) => (b.score || 0) - (a.score || 0))[0];

    if (!candidate) {
      return {
        x: 0,
        y: 0,
        width: imageWidth,
        height: Math.round(imageHeight / 3),
      };
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

