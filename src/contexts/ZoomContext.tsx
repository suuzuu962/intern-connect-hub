import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface ZoomContextType {
  zoomLevel: number;
  deviceMode: DeviceMode;
  setZoomLevel: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setDeviceMode: (mode: DeviceMode) => void;
}

const ZoomContext = createContext<ZoomContextType | undefined>(undefined);

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export const ZoomProvider = ({ children }: { children: ReactNode }) => {
  const [zoomLevel, setZoomLevelState] = useState(() => {
    const saved = localStorage.getItem('app-zoom-level');
    return saved ? parseFloat(saved) : 1;
  });
  
  const [deviceMode, setDeviceModeState] = useState<DeviceMode>(() => {
    const saved = localStorage.getItem('app-device-mode');
    return (saved as DeviceMode) || 'desktop';
  });

  useEffect(() => {
    localStorage.setItem('app-zoom-level', zoomLevel.toString());
  }, [zoomLevel]);

  useEffect(() => {
    localStorage.setItem('app-device-mode', deviceMode);
  }, [deviceMode]);

  const setZoomLevel = (level: number) => {
    const clampedLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, level));
    setZoomLevelState(clampedLevel);
  };

  const zoomIn = () => {
    setZoomLevel(zoomLevel + ZOOM_STEP);
  };

  const zoomOut = () => {
    setZoomLevel(zoomLevel - ZOOM_STEP);
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const setDeviceMode = (mode: DeviceMode) => {
    setDeviceModeState(mode);
  };

  return (
    <ZoomContext.Provider
      value={{
        zoomLevel,
        deviceMode,
        setZoomLevel,
        zoomIn,
        zoomOut,
        resetZoom,
        setDeviceMode,
      }}
    >
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

export { DEVICE_WIDTHS };
export type { DeviceMode };
