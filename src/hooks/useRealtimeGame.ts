import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState, Player, Suit, GamePhase, RoundResult } from '@/types/game';

const ROUND_DURATION = 10 * 60 * 1000; // 10 minutes
const VOTING_DURATION = 30 * 1000; // 30 seconds

const generateId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

type DbGame = {
  id: string;
  host_id: string;
  phase: string;
  current_round: number;
  round_start_time: string | null;
  voting_end_time: string | null;
  winner: string | null;
};

type DbPlayer = {
  id: string;
  game_id: string;
  name: string;
  suit: string | null;
  is_jack: boolean;
  status: string;
  eliminated_round: number | null;
  last_vote: string | null;
  vote_correct: boolean | null;
  is_host: boolean;
};

type DbRoundResult = {
  id: string;
  game_id: string;
  round_number: number;
  player_id: string;
  player_name: string;
  vote: string | null;
  correct: boolean;
  eliminated: boolean;
};

export function useRealtimeGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert database models to app models
  const convertToGameState = useCallback((
    game: DbGame, 
    players: DbPlayer[], 
    roundResults: DbRoundResult[]
  ): GameState => {
    const groupedResults: RoundResult[] = [];
    const resultsByRound = new Map<number, RoundResult['eliminations']>();

    roundResults.forEach(r => {
      if (!r.correct) {
        if (!resultsByRound.has(r.round_number)) {
          resultsByRound.set(r.round_number, []);
        }
        resultsByRound.get(r.round_number)!.push({
          playerId: r.player_id,
          playerName: r.player_name,
          guessedSuit: (r.vote as Suit) || 'hearts',
          actualSuit: players.find(p => p.id === r.player_id)?.suit as Suit || 'hearts',
        });
      }
    });

    resultsByRound.forEach((eliminations, round) => {
      groupedResults.push({ round, eliminations });
    });

    groupedResults.sort((a, b) => a.round - b.round);

    return {
      id: game.id,
      phase: game.phase as GamePhase,
      currentRound: game.current_round,
      roundStartTime: game.round_start_time ? new Date(game.round_start_time).getTime() : 0,
      roundDuration: ROUND_DURATION,
      votingEndTime: game.voting_end_time ? new Date(game.voting_end_time).getTime() : undefined,
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        suit: (p.suit as Suit) || 'hearts',
        isJack: p.is_jack,
        isHost: p.is_host,
        status: p.status as 'active' | 'eliminated' | 'spectator',
        lastVote: p.last_vote as Suit | undefined,
        eliminatedInRound: p.eliminated_round ?? undefined,
      })),
      roundResults: groupedResults,
      winner: game.winner as 'jack' | 'players' | null,
    };
  }, []);

  // Load game state from localStorage and database
  const loadGameState = useCallback(async () => {
    const savedGameId = localStorage.getItem('jackOfHearts_gameId');
    const savedPlayerId = localStorage.getItem('jackOfHearts_playerId');

    if (!savedGameId || !savedPlayerId) {
      setIsLoading(false);
      return;
    }

    setCurrentPlayerId(savedPlayerId);

    try {
      // Fetch game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', savedGameId)
        .maybeSingle();

      if (gameError) throw gameError;
      if (!gameData) {
        // Game no longer exists
        localStorage.removeItem('jackOfHearts_gameId');
        localStorage.removeItem('jackOfHearts_playerId');
        setIsLoading(false);
        return;
      }

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', savedGameId)
        .order('joined_at');

      if (playersError) throw playersError;

      // Fetch round results
      const { data: resultsData, error: resultsError } = await supabase
        .from('round_results')
        .select('*')
        .eq('game_id', savedGameId)
        .order('round_number');

      if (resultsError) throw resultsError;

      const state = convertToGameState(
        gameData as DbGame, 
        (playersData || []) as DbPlayer[], 
        (resultsData || []) as DbRoundResult[]
      );
      setGameState(state);
    } catch (err) {
      console.error('Error loading game:', err);
      setError('Error al cargar el juego');
    } finally {
      setIsLoading(false);
    }
  }, [convertToGameState]);

  // Set up realtime subscriptions
  useEffect(() => {
    const savedGameId = localStorage.getItem('jackOfHearts_gameId');
    if (!savedGameId) return;

    const channel = supabase
      .channel(`game-${savedGameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${savedGameId}`,
        },
        () => {
          loadGameState();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${savedGameId}`,
        },
        () => {
          loadGameState();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'round_results',
          filter: `game_id=eq.${savedGameId}`,
        },
        () => {
          loadGameState();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadGameState]);

  // Initial load
  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

  const createGame = useCallback(async (hostName: string) => {
    const hostId = generateId();
    const gameId = generateId();

    try {
      // Create game
      const { error: gameError } = await supabase
        .from('games')
        .insert({
          id: gameId,
          host_id: hostId,
          phase: 'lobby',
          current_round: 0,
        });

      if (gameError) throw gameError;

      // Create host player
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          id: hostId,
          game_id: gameId,
          name: hostName,
          is_host: true,
          status: 'active',
        });

      if (playerError) throw playerError;

      // Save to localStorage
      localStorage.setItem('jackOfHearts_gameId', gameId);
      localStorage.setItem('jackOfHearts_playerId', hostId);
      setCurrentPlayerId(hostId);

      // Reload state
      await loadGameState();

      return { gameId, playerId: hostId };
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Error al crear la partida');
      return null;
    }
  }, [loadGameState]);

  const joinGame = useCallback(async (gameId: string, playerName: string) => {
    const playerId = generateId();

    try {
      // Check if game exists and is in lobby
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId.toUpperCase())
        .maybeSingle();

      if (gameError) throw gameError;
      if (!gameData) {
        setError('Partida no encontrada');
        return null;
      }
      if (gameData.phase !== 'lobby') {
        setError('La partida ya ha comenzado');
        return null;
      }

      // Create player
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          id: playerId,
          game_id: gameId.toUpperCase(),
          name: playerName,
          is_host: false,
          status: 'active',
        });

      if (playerError) throw playerError;

      // Save to localStorage
      localStorage.setItem('jackOfHearts_gameId', gameId.toUpperCase());
      localStorage.setItem('jackOfHearts_playerId', playerId);
      setCurrentPlayerId(playerId);

      // Reload state
      await loadGameState();

      return playerId;
    } catch (err) {
      console.error('Error joining game:', err);
      setError('Error al unirse a la partida');
      return null;
    }
  }, [loadGameState]);

  const removePlayer = useCallback(async (playerId: string) => {
    if (!gameState) return;

    try {
      await supabase
        .from('players')
        .delete()
        .eq('id', playerId);
    } catch (err) {
      console.error('Error removing player:', err);
    }
  }, [gameState]);

  const startGame = useCallback(async () => {
    if (!gameState || gameState.players.length < 3) return;

    try {
      const shuffledSuits = shuffleArray([...SUITS, ...SUITS, ...SUITS, ...SUITS]);
      const jackIndex = Math.floor(Math.random() * gameState.players.length);

      // Update all players with suits
      const updatePromises = gameState.players.map((player, index) => 
        supabase
          .from('players')
          .update({
            suit: shuffledSuits[index % shuffledSuits.length],
            is_jack: index === jackIndex,
            status: 'active',
          })
          .eq('id', player.id)
      );

      await Promise.all(updatePromises);

      // Update game phase
      await supabase
        .from('games')
        .update({
          phase: 'playing',
          current_round: 1,
          round_start_time: new Date().toISOString(),
        })
        .eq('id', gameState.id);
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Error al iniciar el juego');
    }
  }, [gameState]);

  const startVoting = useCallback(async () => {
    if (!gameState) return;

    try {
      await supabase
        .from('games')
        .update({
          phase: 'voting',
          voting_end_time: new Date(Date.now() + VOTING_DURATION).toISOString(),
        })
        .eq('id', gameState.id);
    } catch (err) {
      console.error('Error starting voting:', err);
    }
  }, [gameState]);

  const submitVote = useCallback(async (playerId: string, guessedSuit: Suit) => {
    if (!gameState) return;

    try {
      await supabase
        .from('players')
        .update({ last_vote: guessedSuit })
        .eq('id', playerId);
    } catch (err) {
      console.error('Error submitting vote:', err);
    }
  }, [gameState]);

  const processRoundResults = useCallback(async () => {
    if (!gameState) return;

    try {
      const activePlayers = gameState.players.filter(p => p.status === 'active');
      const roundResultsToInsert: Omit<DbRoundResult, 'id'>[] = [];
      const eliminatedPlayerIds: string[] = [];

      for (const player of activePlayers) {
        const correct = player.lastVote === player.suit;
        
        roundResultsToInsert.push({
          game_id: gameState.id,
          round_number: gameState.currentRound,
          player_id: player.id,
          player_name: player.name,
          vote: player.lastVote || null,
          correct,
          eliminated: !correct,
        });

        if (!correct || !player.lastVote) {
          eliminatedPlayerIds.push(player.id);
        }
      }

      // Insert round results
      if (roundResultsToInsert.length > 0) {
        await supabase
          .from('round_results')
          .insert(roundResultsToInsert);
      }

      // Update eliminated players
      if (eliminatedPlayerIds.length > 0) {
        await supabase
          .from('players')
          .update({
            status: 'eliminated',
            eliminated_round: gameState.currentRound,
          })
          .in('id', eliminatedPlayerIds);
      }

      // Clear votes for remaining players
      await supabase
        .from('players')
        .update({ last_vote: null })
        .eq('game_id', gameState.id)
        .eq('status', 'active');

      // Fetch updated players to check win conditions
      const { data: updatedPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameState.id);

      const remaining = (updatedPlayers || []).filter((p: DbPlayer) => p.status === 'active');
      const jackPlayer = (updatedPlayers || []).find((p: DbPlayer) => p.is_jack);
      
      let winner: string | null = null;
      let newPhase: GamePhase = 'results';

      if (jackPlayer?.status === 'eliminated') {
        winner = 'players';
        newPhase = 'finished';
      } else if (remaining.length === 1 && remaining[0].is_jack) {
        winner = 'jack';
        newPhase = 'finished';
      } else if (remaining.length === 0) {
        winner = 'players';
        newPhase = 'finished';
      }

      // Update game
      await supabase
        .from('games')
        .update({
          phase: newPhase,
          winner,
        })
        .eq('id', gameState.id);
    } catch (err) {
      console.error('Error processing results:', err);
    }
  }, [gameState]);

  const continueToNextRound = useCallback(async () => {
    if (!gameState) return;

    try {
      await supabase
        .from('games')
        .update({
          phase: 'playing',
          current_round: gameState.currentRound + 1,
          round_start_time: new Date().toISOString(),
          voting_end_time: null,
        })
        .eq('id', gameState.id);
    } catch (err) {
      console.error('Error continuing to next round:', err);
    }
  }, [gameState]);

  const endGame = useCallback(async (forcedWinner?: 'players') => {
    if (!gameState) return;

    try {
      await supabase
        .from('games')
        .update({
          phase: 'finished',
          winner: forcedWinner || 'players',
        })
        .eq('id', gameState.id);
    } catch (err) {
      console.error('Error ending game:', err);
    }
  }, [gameState]);

  const resetGame = useCallback(() => {
    localStorage.removeItem('jackOfHearts_gameId');
    localStorage.removeItem('jackOfHearts_playerId');
    setGameState(null);
    setCurrentPlayerId(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const currentPlayer = gameState?.players.find(p => p.id === currentPlayerId);

  // Map 'finished' phase to 'ended' for compatibility with existing components
  const mappedGameState = gameState ? {
    ...gameState,
    phase: gameState.phase === 'finished' ? 'ended' as GamePhase : gameState.phase,
  } : null;

  return {
    gameState: mappedGameState,
    currentPlayer,
    currentPlayerId,
    isLoading,
    error,
    createGame,
    joinGame,
    removePlayer,
    startGame,
    startVoting,
    submitVote,
    processRoundResults,
    continueToNextRound,
    endGame,
    resetGame,
    clearError,
  };
}
