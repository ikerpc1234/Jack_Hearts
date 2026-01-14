import { Suit, SUIT_SYMBOLS } from '@/types/game';
import { cn } from '@/lib/utils';

interface SuitIconProps {
  suit: Suit;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBackground?: boolean;
}

const sizeClasses = {
  sm: 'text-lg w-6 h-6',
  md: 'text-2xl w-10 h-10',
  lg: 'text-4xl w-14 h-14',
  xl: 'text-6xl w-20 h-20',
};

export function SuitIcon({ suit, size = 'md', className, showBackground = false }: SuitIconProps) {
  const suitColorClass = {
    hearts: 'text-hearts',
    diamonds: 'text-diamonds',
    clubs: 'text-clubs',
    spades: 'text-spades',
  }[suit];

  const bgClass = showBackground ? {
    hearts: 'bg-hearts/20',
    diamonds: 'bg-diamonds/20',
    clubs: 'bg-clubs/20',
    spades: 'bg-spades/20',
  }[suit] : '';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-bold',
        sizeClasses[size],
        suitColorClass,
        bgClass,
        className
      )}
    >
      {SUIT_SYMBOLS[suit]}
    </span>
  );
}
