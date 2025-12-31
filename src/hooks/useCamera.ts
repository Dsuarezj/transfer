import { useState, useRef, useCallback } from 'react';

interface CameraCapabilities {
  exposureCompensation?: { min: number; max: number; step: number };
  exposureMode?: string[];
  focusMode?: string[];
  whiteBalanceMode?: string[];
  torch?: boolean;
  zoom?: { min: number; max: number; step: number };
}

interface CameraSettings {
  exposureCompensation: number;
  torch: boolean;
  zoom: number;
}

export function useCamera() {
  const [isActive, setIsActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<CameraCapabilities>({});
  const [settings, setSettings] = useState<CameraSettings>({
    exposureCompensation: 0,
    torch: false,
    zoom: 1,
  });
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const imageCapture = useRef<ImageCapture | null>(null);

  const getAdvancedConstraints = () => ({
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 4032, min: 1920 },
      height: { ideal: 3024, min: 1080 },
      aspectRatio: { ideal: 4 / 3 },
      frameRate: { ideal: 30 },
      focusMode: { ideal: 'continuous' },
      exposureMode: { ideal: 'continuous' },
      whiteBalanceMode: { ideal: 'continuous' },
    } as MediaTrackConstraints,
    audio: false,
  });

  const extractCapabilities = (track: MediaStreamTrack) => {
    try {
      const caps = track.getCapabilities() as any;
      const extracted: CameraCapabilities = {};

      if (caps.exposureCompensation) {
        extracted.exposureCompensation = {
          min: caps.exposureCompensation.min,
          max: caps.exposureCompensation.max,
          step: caps.exposureCompensation.step || 0.1,
        };
      }

      if (caps.exposureMode) {
        extracted.exposureMode = caps.exposureMode;
      }

      if (caps.focusMode) {
        extracted.focusMode = caps.focusMode;
      }

      if (caps.whiteBalanceMode) {
        extracted.whiteBalanceMode = caps.whiteBalanceMode;
      }

      if (caps.torch !== undefined) {
        extracted.torch = caps.torch;
      }

      if (caps.zoom) {
        extracted.zoom = {
          min: caps.zoom.min,
          max: caps.zoom.max,
          step: caps.zoom.step || 0.1,
        };
      }

      setCapabilities(extracted);
      return extracted;
    } catch {
      return {};
    }
  };

  const applyOptimalSettings = async (track: MediaStreamTrack, caps: CameraCapabilities) => {
    try {
      const constraints: any = {};

      if (caps.focusMode?.includes('continuous')) {
        constraints.focusMode = 'continuous';
      }

      if (caps.exposureMode?.includes('continuous')) {
        constraints.exposureMode = 'continuous';
      }

      if (caps.whiteBalanceMode?.includes('continuous')) {
        constraints.whiteBalanceMode = 'continuous';
      }

      if (Object.keys(constraints).length > 0) {
        await track.applyConstraints({ advanced: [constraints] });
      }
    } catch (err) {
      console.warn('Could not apply optimal settings:', err);
    }
  };

  const startCamera = async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia(getAdvancedConstraints());
      const track = stream.getVideoTracks()[0];

      if (!track) {
        throw new Error('No video track available');
      }

      trackRef.current = track;
      streamRef.current = stream;

      if ('ImageCapture' in window) {
        imageCapture.current = new ImageCapture(track);
      }

      const caps = extractCapabilities(track);
      await applyOptimalSettings(track, caps);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
    } catch (err: any) {
      const message = err.name === 'NotAllowedError'
        ? 'Permiso de camara denegado. Habilita el acceso en la configuracion.'
        : err.name === 'NotFoundError'
        ? 'No se encontro camara trasera.'
        : 'No se pudo acceder a la camara.';
      setError(message);
      console.error('Camera error:', err);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    trackRef.current = null;
    imageCapture.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setCapabilities({});
  }, []);

  const setExposureCompensation = async (value: number) => {
    if (!trackRef.current || !capabilities.exposureCompensation) return;

    try {
      await trackRef.current.applyConstraints({
        advanced: [{ exposureCompensation: value } as any],
      });
      setSettings(prev => ({ ...prev, exposureCompensation: value }));
    } catch (err) {
      console.warn('Could not set exposure:', err);
    }
  };

  const setTorch = async (enabled: boolean) => {
    if (!trackRef.current || !capabilities.torch) return;

    try {
      await trackRef.current.applyConstraints({
        advanced: [{ torch: enabled } as any],
      });
      setSettings(prev => ({ ...prev, torch: enabled }));
    } catch (err) {
      console.warn('Could not toggle torch:', err);
    }
  };

  const setZoom = async (value: number) => {
    if (!trackRef.current || !capabilities.zoom) return;

    try {
      await trackRef.current.applyConstraints({
        advanced: [{ zoom: value } as any],
      });
      setSettings(prev => ({ ...prev, zoom: value }));
    } catch (err) {
      console.warn('Could not set zoom:', err);
    }
  };

  const focusOnPoint = async (x: number, y: number) => {
    if (!trackRef.current) return;

    const caps = capabilities;
    if (!caps.focusMode?.includes('manual') && !caps.exposureMode?.includes('manual')) {
      return;
    }

    try {
      const constraints: any = {
        advanced: [{
          pointsOfInterest: [{ x, y }],
        }],
      };

      if (caps.focusMode?.includes('manual')) {
        constraints.advanced[0].focusMode = 'manual';
      }
      if (caps.exposureMode?.includes('manual')) {
        constraints.advanced[0].exposureMode = 'manual';
      }

      await trackRef.current.applyConstraints(constraints);

      setTimeout(async () => {
        if (!trackRef.current) return;
        try {
          const resetConstraints: any = { advanced: [{}] };
          if (caps.focusMode?.includes('continuous')) {
            resetConstraints.advanced[0].focusMode = 'continuous';
          }
          if (caps.exposureMode?.includes('continuous')) {
            resetConstraints.advanced[0].exposureMode = 'continuous';
          }
          await trackRef.current.applyConstraints(resetConstraints);
        } catch {}
      }, 2000);
    } catch (err) {
      console.warn('Could not focus on point:', err);
    }
  };

  const capturePhoto = async (): Promise<Blob | null> => {
    if (isCapturing) return null;
    setIsCapturing(true);

    try {
      if (imageCapture.current) {
        try {
          const blob = await imageCapture.current.takePhoto({
            imageWidth: 4032,
            imageHeight: 3024,
          });
          const url = URL.createObjectURL(blob);
          setCapturedImage(url);
          return blob;
        } catch (err) {
          console.warn('ImageCapture.takePhoto failed, falling back to canvas:', err);
        }
      }

      if (!videoRef.current) return null;

      const video = videoRef.current;
      const canvas = document.createElement('canvas');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d', {
        alpha: false,
        desynchronized: true,
      });

      if (!ctx) return null;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0);

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setCapturedImage(url);
              resolve(blob);
            } else {
              resolve(null);
            }
          },
          'image/jpeg',
          0.98
        );
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const resetCapture = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
  };

  return {
    videoRef,
    isActive,
    capturedImage,
    error,
    capabilities,
    settings,
    isCapturing,
    startCamera,
    stopCamera,
    capturePhoto,
    resetCapture,
    setExposureCompensation,
    setTorch,
    setZoom,
    focusOnPoint,
  };
}
