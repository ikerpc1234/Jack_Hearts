import { Player, Suit, SUIT_NAMES } from '@/types/game';
import { SuitIcon } from './SuitIcon';
import { cn } from '@/lib/utils';
import { Crown, Skull, Eye, X } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  showSuit?: boolean;
  showJack?: boolean;
  isCurrentPlayer?: boolean;
  canRemove?: boolean;
  onRemove?: () => void;
}

export function PlayerCard({ 
  player, 
  showSuit = false, 
  showJack = false,
  isCurrentPlayer = false,
  canRemove = false,
  onRemove,
}: PlayerCardProps) {
  const isEliminated = player.status === 'eliminated';

  return (
    <div
      className={cn(
        'glass-card p-4 flex items-center gap-3 transition-all',
        isEliminated && 'opacity-50',
        isCurrentPlayer && 'ring-2 ring-primary',
      )}
    >
      {/* Suit display */}
      <div className="flex-shrink-0">
        {showSuit ? (
          <SuitIcon suit={player.suit} size="md" showBackground />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xl">?</span>
          </div>
        )}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-medium truncate',
            isCurrentPlayer && 'text-primary'
          )}>
            {player.name}
          </span>
          {player.isHost && (
            <Crown className="w-4 h-4 text-primary flex-shrink-0" />
          )}
          {showJack && player.isJack && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-jack/20 text-jack font-medium">
              Jack
            </span>
          )}
        </div>
        {showSuit && (
          <span className="text-sm text-muted-foreground">
            {SUIT_NAMES[player.suit]}
          </span>
        )}
      </div>

      {/* Status icons */}
      <div className="flex-shrink-0">
        {isEliminated ? (
          <Skull className="w-5 h-5 text-destructive" />
        ) : player.status === 'spectator' ? (
          <Eye className="w-5 h-5 text-muted-foreground" />
        ) : null}
      </div>

      {/* Remove button */}
      {canRemove && onRemove && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center text-destructive transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
