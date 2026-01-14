import { GameState, Player, Suit } from '@/types/game';
import { PlayerCard } from '@/components/game/PlayerCard';
import { TimerDisplay } from '@/components/game/TimerDisplay';
import { VotingModal } from '@/components/game/VotingModal';
import { useRobustTimer } from '@/hooks/useRobustTimer';
import { cn } from '@/lib/utils';
import { Eye, Clock, Users, Skull } from 'lucide-react';

interface GameScreenProps {
  gameState: GameState;
  currentPlayer: Player;
  onStartVoting: () => void;
  onVote: (suit: Suit) => void;
  onProcessResults: () => void;
  onEndGame: () => void;
}

export function GameScreen({
  gameState,
  currentPlayer,
  onStartVoting,
  onVote,
  onProcessResults,
  onEndGame,
}: GameScreenProps) {
  const isHost = currentPlayer.isHost;
  const isEliminated = currentPlayer.status === 'eliminated';
  const isVoting = gameState.phase === 'voting';
  const roundEndTime = gameState.roundStartTime + gameState.roundDuration;

  const { formattedTime, progress, timeRemaining } = useRobustTimer({
    targetTime: roundEndTime,
    onComplete: isHost ? onStartVoting : undefined,
    enabled: gameState.phase === 'playing',
  });

  const isUrgent = timeRemaining < 60000; // Less than 1 minute
  const activePlayers = gameState.players.filter(p => p.status === 'active');
  const eliminatedPlayers = gameState.players.filter(p => p.status === 'eliminated');

  // Determine what suits the current player can see
  const getVisibleSuit = (player: Player): boolean => {
    if (isHost && player.id !== currentPlayer.id) {
      return true; // Host can see everyone's suit except their own
    }
    return false;
  };

  const handleVotingTimeExpired = () => {
    if (isHost) {
      onProcessResults();
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Voting Modal */}
      {isVoting && !isEliminated && gameState.votingEndTime && (
        <VotingModal
          votingEndTime={gameState.votingEndTime}
          onVote={(suit) => onVote(suit)}
          hasVoted={!!currentPlayer.lastVote}
          currentVote={currentPlayer.lastVote}
          onTimeExpired={handleVotingTimeExpired}
        />
      )}

      {/* Header */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
          <Clock className="w-4 h-4" />
          <span>Ronda {gameState.currentRound}</span>
        </div>

        {gameState.phase === 'playing' && (
          <TimerDisplay
            formattedTime={formattedTime}
            progress={1 - progress}
            isUrgent={isUrgent}
            label="Tiempo restante"
          />
        )}

        {isVoting && (
          <div className="py-4">
            <span className="px-4 py-2 rounded-full bg-accent/20 text-accent font-semibold animate-pulse-slow">
              ¡Votación en curso!
            </span>
          </div>
        )}
      </div>

      {/* Player status banner */}
      {isEliminated && (
        <div className="mb-4 p-4 rounded-lg bg-destructive/20 border border-destructive/30 flex items-center gap-3">
          <Eye className="w-5 h-5 text-destructive" />
          <div>
            <div className="font-medium text-destructive">Modo espectador</div>
            <div className="text-sm text-muted-foreground">
              Has sido eliminado en la ronda {currentPlayer.eliminatedInRound}
            </div>
          </div>
        </div>
      )}

      {/* Players list */}
      <div className="flex-1 overflow-auto">
        {/* Active players */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Jugadores activos ({activePlayers.length})
            </span>
          </div>
          <div className="space-y-2">
            {activePlayers.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === currentPlayer.id}
                showSuit={getVisibleSuit(player)}
              />
            ))}
          </div>
        </div>

        {/* Eliminated players */}
        {eliminatedPlayers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Skull className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Eliminados ({eliminatedPlayers.length})
              </span>
            </div>
            <div className="space-y-2">
              {eliminatedPlayers.map(player => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isCurrentPlayer={player.id === currentPlayer.id}
                  showSuit
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Host controls */}
      {isHost && gameState.phase === 'playing' && (
        <div className="pt-4 space-y-3">
          <button
            onClick={onStartVoting}
            className="w-full py-3 rounded-lg bg-accent text-accent-foreground font-semibold"
          >
            Forzar votación ahora
          </button>
          <button
            onClick={onEndGame}
            className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            Finalizar partida
          </button>
        </div>
      )}
    </div>
  );
}
