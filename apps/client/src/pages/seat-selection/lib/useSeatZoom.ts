import { useCallback, useMemo, useState } from 'react';

interface UseSeatZoomOptions {
  min?: number;
  max?: number;
  step?: number;
  initial?: number;
}

interface UseSeatZoomResult {
  zoomLevel: number;
  zoomPercentage: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomReset: () => void;
}

const DEFAULT_STEP = 0.15;
const DEFAULT_MIN = 0.6;
const DEFAULT_MAX = 2;

export function useSeatZoom(options: UseSeatZoomOptions = {}): UseSeatZoomResult {
  const { min = DEFAULT_MIN, max = DEFAULT_MAX, step = DEFAULT_STEP, initial = 1 } = options;

  const [zoomLevel, setZoomLevel] = useState(initial);

  const clampZoom = useCallback(
    (value: number) => {
      const rounded = Number(value.toFixed(2));
      return Math.min(max, Math.max(min, rounded));
    },
    [max, min],
  );

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => clampZoom(prev + step));
  }, [clampZoom, step]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => clampZoom(prev - step));
  }, [clampZoom, step]);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(initial);
  }, [initial]);

  const zoomPercentage = useMemo(() => Math.round(zoomLevel * 100), [zoomLevel]);

  return {
    zoomLevel,
    zoomPercentage,
    canZoomIn: zoomLevel < max,
    canZoomOut: zoomLevel > min,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
  };
}
