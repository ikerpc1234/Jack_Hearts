import { useState } from 'react';
import { Crown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HomeScreenProps {
  onCreateGame: (hostName: string) => void;
  onJoinGame: (playerName: string) => void;
  hasExistingGame: boolean;
}

export function HomeScreen({ onCreateGame, onJoinGame, hasExistingGame }: HomeScreenProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    if (mode === 'create') {
      onCreateGame(name.trim());
    } else if (mode === 'join') {
      onJoinGame(name.trim());
    }
  };

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

      {mode === 'select' ? (
        <div className="w-full max-w-xs space-y-4">
          <button
            onClick={() => setMode('create')}
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

          {hasExistingGame && (
            <button
              onClick={() => setMode('join')}
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
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-6">
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
              autoFocus
              maxLength={20}
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className={cn(
              'w-full py-4 rounded-lg font-semibold transition-all',
              name.trim() 
                ? 'btn-gold' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {mode === 'create' ? 'Crear partida' : 'Unirse'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('select');
              setName('');
            }}
            className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            Volver
          </button>
        </form>
      )}
    </div>
  );
}
