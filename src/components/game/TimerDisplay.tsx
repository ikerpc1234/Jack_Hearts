import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  formattedTime: string;
  progress: number;
  isUrgent?: boolean;
  size?: 'sm' | 'lg';
  label?: string;
}

export function TimerDisplay({ formattedTime, progress, isUrgent, size = 'lg', label }: TimerDisplayProps) {
  const radius = size === 'lg' ? 45 : 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-sm text-muted-foreground uppercase tracking-wide">{label}</span>
      )}
      <div className="relative">
        <svg
          className={cn(
            size === 'lg' ? 'w-28 h-28' : 'w-20 h-20',
            'transform -rotate-90'
          )}
        >
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={size === 'lg' ? 6 : 4}
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={size === 'lg' ? 6 : 4}
            strokeLinecap="round"
            className={cn(
              'transition-all duration-1000',
              isUrgent ? 'text-destructive animate-pulse-slow' : 'text-primary'
            )}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>
        <div 
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            size === 'lg' ? 'text-2xl' : 'text-lg',
            'font-mono font-bold',
            isUrgent ? 'text-destructive' : 'text-foreground'
          )}
        >
          {formattedTime}
        </div>
      </div>
    </div>
  );
}
