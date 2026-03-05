import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NextStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
  color: string;
}

interface NextStepsCardsProps {
  steps: NextStep[];
  className?: string;
}

export const NextStepsCards = ({ steps, className }: NextStepsCardsProps) => {
  const incomplete = steps.filter(s => !s.completed);
  const completedCount = steps.filter(s => s.completed).length;

  if (incomplete.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Next Steps</h2>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {steps.length} completed
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "h-2 w-8 rounded-full transition-colors",
                step.completed ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {incomplete.map((step) => (
          <Card
            key={step.id}
            className="border hover:shadow-md transition-all duration-200 hover:scale-[1.01] cursor-pointer group"
            onClick={step.action}
          >
            <CardContent className="p-5">
              <div className={cn("inline-flex p-2.5 rounded-xl mb-3", step.color)}>
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {step.description}
              </p>
              {step.action && (
                <span className="inline-flex items-center text-xs font-medium text-primary group-hover:gap-2 gap-1 transition-all">
                  {step.actionLabel || 'Get Started'}
                  <ArrowRight className="h-3 w-3" />
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
