import { PreprocessingConfig } from '../types/receipt';

export async function preprocessImage(
  imageData: string,
  config: PreprocessingConfig
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      let imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageDataObj.data;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        r = r * config.contrast + (config.brightness - 1) * 255;
        g = g * config.contrast + (config.brightness - 1) * 255;
        b = b * config.contrast + (config.brightness - 1) * 255;

        if (config.threshold) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const thresholdValue = config.thresholdValue || 128;
          const value = gray > thresholdValue ? 255 : 0;
          r = g = b = value;
        }

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }

      if (config.sharpen) {
        imageDataObj = applySharpen(imageDataObj);
      }

      ctx.putImageData(imageDataObj, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.src = imageData;
  });
}

function applySharpen(imageData: ImageData): ImageData {
  const pixels = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(width, height);

  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += pixels[idx] * kernel[kernelIdx];
          }
        }
        const idx = (y * width + x) * 4 + c;
        output.data[idx] = Math.min(255, Math.max(0, sum));
      }
      const idx = (y * width + x) * 4 + 3;
      output.data[idx] = pixels[idx];
    }
  }

  return output;
}
