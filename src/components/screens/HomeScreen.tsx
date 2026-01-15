import { useState } from 'react';
import { Crown, Users, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HomeScreenProps {
  onCreateGame: (hostName: string) => Promise<{ gameId: string; playerId: string } | null>;
  onJoinGame: (gameId: string, playerName: string) => Promise<string | null>;
  isLoading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export function HomeScreen({ 
  onCreateGame, 
  onJoinGame, 
  isLoading,
  error,
  onClearError,
}: HomeScreenProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await onCreateGame(name.trim());
      } else if (mode === 'join') {
        if (!gameId.trim()) return;
        await onJoinGame(gameId.trim().toUpperCase(), name.trim());
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setMode('select');
    setName('');
    setGameId('');
    onClearError?.();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Logo & Title */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-hearts to-diamonds mb-6">
          <span className="text-4xl">♥</span>
        </div>
        <h1 className="font-display text-4xl mb-2">Jack of Hearts</h1>
        <p className="text-muted-foreground">El juego del engaño</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="w-full max-w-xs mb-4 p-3 rounded-lg bg-destructive/20 border border-destructive/30 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

      {mode === 'select' ? (
        <div className="w-full max-w-xs space-y-4">
          <button
            onClick={() => {
              setMode('create');
              onClearError?.();
            }}
            className="w-full glass-card p-5 flex items-center gap-4 hover:bg-secondary/50 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Crear partida</div>
              <div className="text-sm text-muted-foreground">Sé el anfitrión</div>
            </div>
          </button>

          <button
            onClick={() => {
              setMode('join');
              onClearError?.();
            }}
            className="w-full glass-card p-5 flex items-center gap-4 hover:bg-secondary/50 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Unirse</div>
              <div className="text-sm text-muted-foreground">Entra a una partida</div>
            </div>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-6">
          {mode === 'join' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Código de partida
              </label>
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value.toUpperCase())}
                placeholder="Ej: ABC123"
                className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono text-center text-lg tracking-wider"
                autoFocus
                maxLength={6}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Tu nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Introduce tu nombre"
              className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              autoFocus={mode === 'create'}
              maxLength={20}
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || (mode === 'join' && !gameId.trim()) || isSubmitting}
            className={cn(
              'w-full py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2',
              (name.trim() && (mode !== 'join' || gameId.trim())) && !isSubmitting
                ? 'btn-gold' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {mode === 'create' ? 'Crear partida' : 'Unirse'}
          </button>

          <button
            type="button"
            onClick={handleBack}
            className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSubmitting}
          >
            Volver
          </button>
        </form>
      )}
    </div>
  );
}
