import { useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useZoom } from '@/contexts/ZoomContext';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const ZoomControls = () => {
  const isMobile = useIsMobile();
  const { zoomLevel, zoomIn, zoomOut, resetZoom, setZoomLevel } = useZoom();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      
      if (!isMod) return;

      // Prevent default browser zoom behavior
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetZoom]);

  // Hide on mobile devices - users can pinch-to-zoom natively
  if (isMobile) {
    return null;
  }

  const handleSliderChange = (value: number[]) => {
    setZoomLevel(value[0] / 100);
  };

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg opacity-30 hover:opacity-100 transition-opacity duration-300">
        {/* Zoom Out Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={zoomOut}
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Zoom Out (Ctrl -)</p>
          </TooltipContent>
        </Tooltip>

        {/* Zoom Slider */}
        <div className="flex items-center gap-2 min-w-[120px]">
          <Slider
            value={[zoomLevel * 100]}
            onValueChange={handleSliderChange}
            min={50}
            max={200}
            step={5}
            className="w-full"
          />
        </div>

        {/* Zoom Level Display */}
        <span className="text-xs font-medium min-w-[3rem] text-center text-muted-foreground">
          {Math.round(zoomLevel * 100)}%
        </span>

        {/* Zoom In Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={zoomIn}
              disabled={zoomLevel >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Zoom In (Ctrl +)</p>
          </TooltipContent>
        </Tooltip>

        {/* Reset Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={resetZoom}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Reset (Ctrl 0)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
