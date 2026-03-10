import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export interface PasswordStrengthResult {
  score: number; // 0-4
  label: string;
  checks: { label: string; passed: boolean }[];
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  const checks = [
    { label: 'At least 8 characters', passed: password.length >= 8 },
    { label: 'Contains uppercase letter', passed: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', passed: /[a-z]/.test(password) },
    { label: 'Contains a number', passed: /[0-9]/.test(password) },
    { label: 'Contains special character', passed: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter(c => c.passed).length;

  const labels: Record<number, string> = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
    5: 'Very Strong',
  };

  return { score, label: labels[score] || 'Very Weak', checks };
}

const strengthColors: Record<number, string> = {
  0: 'bg-destructive',
  1: 'bg-destructive',
  2: 'bg-warning',
  3: 'bg-info',
  4: 'bg-success',
  5: 'bg-success',
};

const strengthTextColors: Record<number, string> = {
  0: 'text-destructive',
  1: 'text-destructive',
  2: 'text-warning',
  3: 'text-info',
  4: 'text-success',
  5: 'text-success',
};

export const PasswordStrength = ({ password, className }: PasswordStrengthProps) => {
  const { score, label, checks } = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  const percentage = (score / 5) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Password strength</span>
        <span className={cn('text-xs font-medium', strengthTextColors[score])}>{label}</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full transition-all duration-300 rounded-full', strengthColors[score])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <ul className="grid grid-cols-1 gap-1 mt-2">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-1.5 text-xs">
            {check.passed ? (
              <Check className="h-3 w-3 text-success shrink-0" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            <span className={check.passed ? 'text-foreground' : 'text-muted-foreground'}>
              {check.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
