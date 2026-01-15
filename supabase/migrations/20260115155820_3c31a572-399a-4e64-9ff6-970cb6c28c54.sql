-- Tabla de partidas/juegos
CREATE TABLE public.games (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'lobby' CHECK (phase IN ('lobby', 'playing', 'voting', 'results', 'finished')),
  current_round INTEGER NOT NULL DEFAULT 0,
  round_start_time TIMESTAMPTZ,
  voting_end_time TIMESTAMPTZ,
  winner TEXT CHECK (winner IN ('jack', 'players')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de jugadores
CREATE TABLE public.players (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  suit TEXT CHECK (suit IN ('hearts', 'diamonds', 'clubs', 'spades')),
  is_jack BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'eliminated', 'spectator')),
  eliminated_round INTEGER,
  last_vote TEXT CHECK (last_vote IN ('hearts', 'diamonds', 'clubs', 'spades')),
  vote_correct BOOLEAN,
  is_host BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de resultados por ronda
CREATE TABLE public.round_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  player_id TEXT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  vote TEXT CHECK (vote IN ('hearts', 'diamonds', 'clubs', 'spades')),
  correct BOOLEAN NOT NULL,
  eliminated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, round_number, player_id)
);

-- Índices para mejor rendimiento
CREATE INDEX idx_players_game_id ON public.players(game_id);
CREATE INDEX idx_round_results_game_id ON public.round_results(game_id);

-- Habilitar RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_results ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Acceso público (el juego no requiere autenticación)
CREATE POLICY "Games are viewable by everyone" ON public.games FOR SELECT USING (true);
CREATE POLICY "Games are insertable by everyone" ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY "Games are updatable by everyone" ON public.games FOR UPDATE USING (true);
CREATE POLICY "Games are deletable by everyone" ON public.games FOR DELETE USING (true);

CREATE POLICY "Players are viewable by everyone" ON public.players FOR SELECT USING (true);
CREATE POLICY "Players are insertable by everyone" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Players are updatable by everyone" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Players are deletable by everyone" ON public.players FOR DELETE USING (true);

CREATE POLICY "Round results are viewable by everyone" ON public.round_results FOR SELECT USING (true);
CREATE POLICY "Round results are insertable by everyone" ON public.round_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Round results are updatable by everyone" ON public.round_results FOR UPDATE USING (true);

-- Habilitar Realtime para sincronización en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.round_results;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();