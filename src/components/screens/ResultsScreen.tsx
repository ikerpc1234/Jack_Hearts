import { useEffect } from 'react';
import { GameState, Player, SUIT_NAMES } from '@/types/game';
import { PlayerCard } from '@/components/game/PlayerCard';
import { SuitIcon } from '@/components/game/SuitIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import { ArrowRight, Trophy, Skull, RefreshCw } from 'lucide-react';

interface ResultsScreenProps {
  gameState: GameState;
  currentPlayer: Player;
  onContinue?: () => void;
  onNewGame: () => void;
}

export function ResultsScreen({ 
  gameState, 
  currentPlayer, 
  onContinue, 
  onNewGame,
}: ResultsScreenProps) {
  const isHost = currentPlayer.isHost;
  const isGameEnded = gameState.phase === 'ended';
  const lastRoundResult = gameState.roundResults[gameState.roundResults.length - 1];
  const activePlayers = gameState.players.filter(p => p.status === 'active');
  const jackPlayer = gameState.players.find(p => p.isJack);
  const haptics = useHaptics();

  // Check if current player was eliminated this round
  const wasEliminated = lastRoundResult?.eliminations.some(
    e => e.playerId === currentPlayer.id
  );

  // Trigger haptic feedback based on outcome
  useEffect(() => {
    if (wasEliminated) {
      haptics.eliminated();
    } else if (isGameEnded) {
      haptics.success();
    } else {
      haptics.roundEnd();
    }
  }, [wasEliminated, isGameEnded]);

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="text-center py-6">
        {isGameEnded ? (
          <>
            <div className={cn(
              'inline-flex items-center justify-center w-16 h-16 rounded-full mb-4',
              gameState.winner === 'jack' ? 'bg-jack/20' : 'bg-primary/20'
            )}>
              <Trophy className={cn(
                'w-8 h-8',
                gameState.winner === 'jack' ? 'text-jack' : 'text-primary'
              )} />
            </div>
            <h1 className="font-display text-3xl mb-2">
              {gameState.winner === 'jack' ? '¡Victoria del Jack!' : '¡Victoria de los jugadores!'}
            </h1>
            <p className="text-muted-foreground">
              {gameState.winner === 'jack' 
                ? `${jackPlayer?.name} ha engañado a todos`
                : 'El Jack of Hearts ha sido derrotado'}
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl mb-2">Ronda {gameState.currentRound} completada</h1>
            <p className="text-muted-foreground">
              {lastRoundResult?.eliminations.length || 0} eliminaciones
            </p>
          </>
        )}
      </div>

      {/* Eliminations this round */}
      {lastRoundResult && lastRoundResult.eliminations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Skull className="w-5 h-5 text-destructive" />
            Eliminados esta ronda
          </h2>
          <div className="space-y-3">
            {lastRoundResult.eliminations.map(elimination => (
              <div 
                key={elimination.playerId}
                className="glass-card p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{elimination.playerName}</span>
                  <div className="flex items-center gap-2 text-sm">
                    <SuitIcon suit={elimination.guessedSuit} size="sm" />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <SuitIcon suit={elimination.actualSuit} size="sm" />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Votó {SUIT_NAMES[elimination.guessedSuit]}, era {SUIT_NAMES[elimination.actualSuit]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final reveal (only when game ended) */}
      {isGameEnded && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Revelación final</h2>
          <div className="space-y-2">
            {gameState.players.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                showSuit
                showJack
                isCurrentPlayer={player.id === currentPlayer.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Round history */}
      {gameState.roundResults.length > 1 && isGameEnded && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Historial de rondas</h2>
          <div className="space-y-2">
            {gameState.roundResults.slice(0, -1).map((result, index) => (
              <div key={index} className="glass-card p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Ronda {result.round}</span>
                  <span className="text-sm text-muted-foreground">
                    {result.eliminations.length} eliminación{result.eliminations.length !== 1 ? 'es' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto pt-6 space-y-3">
        {isGameEnded ? (
          <button
            onClick={onNewGame}
            className="w-full py-4 rounded-lg btn-gold flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Nueva partida
          </button>
        ) : isHost && onContinue ? (
          <button
            onClick={onContinue}
            className="w-full py-4 rounded-lg btn-gold"
          >
            Continuar a la ronda {gameState.currentRound + 1}
          </button>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Esperando a que el anfitrión continúe...
          </div>
        )}
      </div>
    </div>
  );
}
