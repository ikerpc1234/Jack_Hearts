import { Player } from '@/types/game';
import { PlayerCard } from '@/components/game/PlayerCard';
import { cn } from '@/lib/utils';
import { Copy, Check, Users } from 'lucide-react';
import { useState } from 'react';

interface LobbyScreenProps {
  gameId: string;
  players: Player[];
  currentPlayer: Player;
  onStartGame: () => void;
  onRemovePlayer: (playerId: string) => void;
  onLeave: () => void;
}

export function LobbyScreen({ 
  gameId, 
  players, 
  currentPlayer,
  onStartGame, 
  onRemovePlayer,
  onLeave,
}: LobbyScreenProps) {
  const [copied, setCopied] = useState(false);
  const isHost = currentPlayer.isHost;
  const canStart = players.length >= 3;

  const copyGameId = () => {
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="font-display text-2xl mb-2">Sala de espera</h1>
        <button
          onClick={copyGameId}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <span className="font-mono text-sm">#{gameId}</span>
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Players list */}
      <div className="flex-1 overflow-auto">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {players.length} jugador{players.length !== 1 ? 'es' : ''}
          </span>
        </div>

        <div className="space-y-3">
          {players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === currentPlayer.id}
              canRemove={isHost && !player.isHost && player.id !== currentPlayer.id}
              onRemove={() => onRemovePlayer(player.id)}
            />
          ))}
        </div>

        {players.length < 3 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Se necesitan al menos 3 jugadores para empezar
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-6 space-y-3">
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={cn(
              'w-full py-4 rounded-lg font-semibold transition-all',
              canStart 
                ? 'btn-gold' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {canStart ? 'Comenzar partida' : `Esperando jugadores (${players.length}/3)`}
          </button>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Esperando a que el anfitrión inicie la partida...
          </div>
        )}

        <button
          onClick={onLeave}
          className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          Abandonar partida
        </button>
      </div>
    </div>
  );
}
