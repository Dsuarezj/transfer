/**
 * Utilidades de pre-procesamiento de imágenes usando Canvas.
 * Todas las funciones operan en el navegador y devuelven Blobs listos para OCR.
 */

export async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('No se pudo convertir canvas a blob'));
      }
    }, 'image/jpeg', 0.95);
  });
}

export function adjustContrast(imageData: ImageData, factor: number): ImageData {
  const data = imageData.data;
  const intercept = 128 * (1 - factor);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] * factor + intercept));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor + intercept));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor + intercept));
  }

  return imageData;
}

export function adjustBrightness(imageData: ImageData, amount: number): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] + amount));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + amount));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + amount));
  }

  return imageData;
}

export function toGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  return imageData;
}

export function sharpenImage(imageData: ImageData): ImageData {
  // Kernel de sharpening simple
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const newData = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const idx = (y * width + x) * 4 + c;
        const center = data[idx];
        const top = data[((y - 1) * width + x) * 4 + c];
        const bottom = data[((y + 1) * width + x) * 4 + c];
        const left = data[(y * width + (x - 1)) * 4 + c];
        const right = data[(y * width + (x + 1)) * 4 + c];

        // Sharpening: center * 5 - neighbors
        const sharpened = Math.max(0, Math.min(255, center * 5 - (top + bottom + left + right)));
        newData[idx] = sharpened;
      }
    }
  }

  return new ImageData(newData, width, height);
}

export async function enhanceImage(blob: Blob, options?: { contrast?: number; brightness?: number; grayscale?: boolean; sharpen?: boolean }): Promise<Blob> {
  const img = await blobToImage(blob);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener contexto de canvas');

  // Usar mejor calidad de renderizado
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const { contrast = 1.3, brightness = 10, grayscale = true, sharpen = true } = options || {};
  
  // Aplicar sharpening primero si está habilitado
  if (sharpen) {
    imageData = sharpenImage(imageData);
  }
  
  adjustContrast(imageData, contrast);
  adjustBrightness(imageData, brightness);
  if (grayscale) {
    toGrayscale(imageData);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvasToBlob(canvas);
}

export async function cropToRegion(
  blob: Blob,
  region: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const img = await blobToImage(blob);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener contexto de canvas');

  canvas.width = region.width;
  canvas.height = region.height;

  ctx.drawImage(
    img,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    region.width,
    region.height
  );

  return canvasToBlob(canvas);
}

