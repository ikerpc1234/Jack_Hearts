import { useState, useEffect } from 'react';
import { Suit, SUIT_NAMES } from '@/types/game';
import { SuitIcon } from './SuitIcon';
import { TimerDisplay } from './TimerDisplay';
import { useRobustTimer } from '@/hooks/useRobustTimer';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface VotingModalProps {
  votingEndTime: number;
  onVote: (suit: Suit) => void;
  hasVoted: boolean;
  currentVote?: Suit;
  onTimeExpired: () => void;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export function VotingModal({ 
  votingEndTime, 
  onVote, 
  hasVoted, 
  currentVote,
  onTimeExpired,
}: VotingModalProps) {
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(currentVote || null);
  const haptics = useHaptics();

  const { formattedTime, progress, timeRemaining } = useRobustTimer({
    targetTime: votingEndTime,
    onComplete: onTimeExpired,
    enabled: !hasVoted,
  });

  const isUrgent = timeRemaining < 10000; // Less than 10 seconds

  // Trigger haptic feedback when voting modal appears
  useEffect(() => {
    haptics.votingStart();
  }, []);

  const handleVote = () => {
    if (selectedSuit && !hasVoted) {
      onVote(selectedSuit);
    }
  };

  if (hasVoted) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-sm w-full text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <SuitIcon suit={currentVote!} size="lg" />
          </div>
          <h2 className="font-display text-2xl mb-2">Voto enviado</h2>
          <p className="text-muted-foreground">
            Has votado: <span className="font-medium text-foreground">{SUIT_NAMES[currentVote!]}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Esperando a que termine la votación...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card p-6 max-w-sm w-full animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle className={cn(
              'w-5 h-5',
              isUrgent ? 'text-destructive animate-pulse' : 'text-primary'
            )} />
            <h2 className="font-display text-xl">¡Tiempo de votar!</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            ¿Cuál crees que es tu palo?
          </p>
        </div>

        {/* Timer */}
        <div className="flex justify-center mb-6">
          <TimerDisplay 
            formattedTime={formattedTime}
            progress={1 - progress}
            isUrgent={isUrgent}
            size="sm"
          />
        </div>

        {/* Suit options */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {SUITS.map(suit => (
            <button
              key={suit}
              onClick={() => setSelectedSuit(suit)}
              className={cn(
                'glass-card p-4 flex flex-col items-center gap-2 transition-all',
                'hover:bg-secondary/50',
                selectedSuit === suit && 'ring-2 ring-primary bg-primary/10'
              )}
            >
              <SuitIcon suit={suit} size="lg" />
              <span className="text-sm font-medium">{SUIT_NAMES[suit]}</span>
            </button>
          ))}
        </div>

        {/* Submit button */}
        <button
          onClick={handleVote}
          disabled={!selectedSuit}
          className={cn(
            'w-full py-4 rounded-lg font-semibold transition-all',
            selectedSuit 
              ? 'btn-gold' 
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          Confirmar voto
        </button>
      </div>
    </div>
  );
}
