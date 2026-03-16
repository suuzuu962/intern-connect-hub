import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScheduleMeetingDialog } from './ScheduleMeetingDialog';

interface UpgradeGateProps {
  featureLabel: string;
  featureKey: string;
  message?: string;
  children: React.ReactNode;
  isLocked: boolean;
}

export const UpgradeGate = ({ featureLabel, featureKey, message, children, isLocked }: UpgradeGateProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative min-h-[400px]">
      {/* Blurred content preview */}
      <div className="pointer-events-none select-none filter blur-sm opacity-40">
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center p-8 rounded-2xl bg-card/95 backdrop-blur-md border shadow-xl">
          <div className="h-14 w-14 rounded-full bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 flex items-center justify-center">
            <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{featureLabel}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {message || 'This feature requires an upgrade. Schedule a 1:1 meeting to learn more.'}
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="rounded-full px-6 gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0 shadow-md"
          >
            <Lock className="h-4 w-4" />
            Upgrade
          </Button>
        </div>
      </div>

      <ScheduleMeetingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        featureLabel={featureLabel}
        featureKey={featureKey}
      />
    </div>
  );
};
