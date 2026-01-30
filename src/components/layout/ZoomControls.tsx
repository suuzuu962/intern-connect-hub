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
  const { zoomLevel, zoomIn, zoomOut, resetZoom, setZoomLevel } = useZoom();
  const isMobile = useIsMobile();

  // Hide on mobile devices - users can pinch-to-zoom natively
  if (isMobile) {
    return null;
  }

  const handleSliderChange = (value: number[]) => {
    setZoomLevel(value[0] / 100);
  };

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg">
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
            <p>Zoom Out</p>
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
            <p>Zoom In</p>
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
            <p>Reset (100%)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
