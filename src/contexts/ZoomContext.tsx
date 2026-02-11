import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ZoomContextType {
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

const ZoomContext = createContext<ZoomContextType | undefined>(undefined);

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const BASE_FONT_SIZE = 16;

export const ZoomProvider = ({ children }: { children: ReactNode }) => {
  const [zoomLevel, setZoomLevelState] = useState(() => {
    const saved = localStorage.getItem('app-zoom-level');
    return saved ? parseFloat(saved) : 1;
  });

  useEffect(() => {
    localStorage.setItem('app-zoom-level', zoomLevel.toString());
    document.documentElement.style.fontSize = `${BASE_FONT_SIZE * zoomLevel}px`;
    return () => {
      document.documentElement.style.fontSize = '';
    };
  }, [zoomLevel]);

  const setZoomLevel = (level: number) => {
    const clampedLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, level));
    setZoomLevelState(clampedLevel);
  };

  const zoomIn = () => setZoomLevel(zoomLevel + ZOOM_STEP);
  const zoomOut = () => setZoomLevel(zoomLevel - ZOOM_STEP);
  const resetZoom = () => setZoomLevel(1);

  return (
    <ZoomContext.Provider value={{ zoomLevel, setZoomLevel, zoomIn, zoomOut, resetZoom }}>
      {children}
    </ZoomContext.Provider>
  );
};

export const useZoom = () => {
  const context = useContext(ZoomContext);
  if (context === undefined) {
    throw new Error('useZoom must be used within a ZoomProvider');
  }
  return context;
};
