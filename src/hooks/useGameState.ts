import { useState, useCallback, useEffect } from 'react';
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

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  // Load game state from localStorage on mount
  useEffect(() => {
    const savedGame = localStorage.getItem('jackOfHearts_game');
    const savedPlayerId = localStorage.getItem('jackOfHearts_playerId');
    if (savedGame) {
      setGameState(JSON.parse(savedGame));
    }
    if (savedPlayerId) {
      setCurrentPlayerId(savedPlayerId);
    }
  }, []);

  // Save game state to localStorage
  useEffect(() => {
    if (gameState) {
      localStorage.setItem('jackOfHearts_game', JSON.stringify(gameState));
    }
  }, [gameState]);

  useEffect(() => {
    if (currentPlayerId) {
      localStorage.setItem('jackOfHearts_playerId', currentPlayerId);
    }
  }, [currentPlayerId]);

  const createGame = useCallback((hostName: string) => {
    const hostId = generateId();
    const gameId = generateId();
    
    const newGame: GameState = {
      id: gameId,
      phase: 'lobby',
      currentRound: 0,
      roundStartTime: 0,
      roundDuration: ROUND_DURATION,
      players: [{
        id: hostId,
        name: hostName,
        suit: 'hearts', // Will be reassigned when game starts
        isJack: false,
        isHost: true,
        status: 'active',
      }],
      roundResults: [],
    };

    setGameState(newGame);
    setCurrentPlayerId(hostId);
    return { gameId, playerId: hostId };
  }, []);

  const joinGame = useCallback((playerName: string) => {
    if (!gameState || gameState.phase !== 'lobby') return null;
    
    const playerId = generateId();
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      suit: 'hearts', // Will be reassigned when game starts
      isJack: false,
      isHost: false,
      status: 'active',
    };

    setGameState(prev => prev ? {
      ...prev,
      players: [...prev.players, newPlayer],
    } : null);
    
    setCurrentPlayerId(playerId);
    return playerId;
  }, [gameState]);

  const removePlayer = useCallback((playerId: string) => {
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        players: prev.players.filter(p => p.id !== playerId),
      };
    });
  }, []);

  const startGame = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.players.length < 3) return prev;

      const shuffledSuits = shuffleArray([...SUITS, ...SUITS, ...SUITS, ...SUITS]);
      const jackIndex = Math.floor(Math.random() * prev.players.length);

      const assignedPlayers = prev.players.map((player, index) => ({
        ...player,
        suit: shuffledSuits[index % shuffledSuits.length],
        isJack: index === jackIndex,
        status: 'active' as const,
      }));

      return {
        ...prev,
        phase: 'playing',
        currentRound: 1,
        roundStartTime: Date.now(),
        players: assignedPlayers,
      };
    });
  }, []);

  const startVoting = useCallback(() => {
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        phase: 'voting',
        votingEndTime: Date.now() + VOTING_DURATION,
      };
    });
  }, []);

  const submitVote = useCallback((playerId: string, guessedSuit: Suit) => {
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        players: prev.players.map(p => 
          p.id === playerId ? { ...p, lastVote: guessedSuit } : p
        ),
      };
    });
  }, []);

  const processRoundResults = useCallback(() => {
    setGameState(prev => {
      if (!prev) return null;

      const activePlayers = prev.players.filter(p => p.status === 'active');
      const eliminations: RoundResult['eliminations'] = [];

      const updatedPlayers = prev.players.map(player => {
        if (player.status !== 'active') return player;

        // If player didn't vote, they're eliminated
        if (!player.lastVote) {
          eliminations.push({
            playerId: player.id,
            playerName: player.name,
            guessedSuit: 'hearts', // Default
            actualSuit: player.suit,
          });
          return { ...player, status: 'eliminated' as const, eliminatedInRound: prev.currentRound };
        }

        // Check if guess was correct
        if (player.lastVote !== player.suit) {
          eliminations.push({
            playerId: player.id,
            playerName: player.name,
            guessedSuit: player.lastVote,
            actualSuit: player.suit,
          });
          return { ...player, status: 'eliminated' as const, eliminatedInRound: prev.currentRound };
        }

        return { ...player, lastVote: undefined };
      });

      const roundResult: RoundResult = {
        round: prev.currentRound,
        eliminations,
      };

      // Check win conditions
      const remainingActive = updatedPlayers.filter(p => p.status === 'active');
      const jackPlayer = updatedPlayers.find(p => p.isJack);
      
      let winner: 'jack' | 'players' | null = null;
      let newPhase: GamePhase = 'results';

      if (jackPlayer?.status === 'eliminated') {
        winner = 'players';
        newPhase = 'ended';
      } else if (remainingActive.length === 1 && remainingActive[0].isJack) {
        winner = 'jack';
        newPhase = 'ended';
      } else if (remainingActive.length === 0) {
        winner = 'players';
        newPhase = 'ended';
      }

      return {
        ...prev,
        phase: newPhase,
        players: updatedPlayers,
        roundResults: [...prev.roundResults, roundResult],
        winner,
      };
    });
  }, []);

  const continueToNextRound = useCallback(() => {
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        phase: 'playing',
        currentRound: prev.currentRound + 1,
        roundStartTime: Date.now(),
        votingEndTime: undefined,
      };
    });
  }, []);

  const endGame = useCallback((forcedWinner?: 'players') => {
    setGameState(prev => {
      if (!prev) return null;
      
      const remainingActive = prev.players.filter(p => p.status === 'active');
      let winner: 'jack' | 'players' | null = forcedWinner || null;
      
      if (!winner) {
        const jackPlayer = prev.players.find(p => p.isJack);
        if (jackPlayer?.status === 'eliminated') {
          winner = 'players';
        } else if (remainingActive.length > 1) {
          winner = 'players';
        }
      }

      return {
        ...prev,
        phase: 'ended',
        winner,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem('jackOfHearts_game');
    localStorage.removeItem('jackOfHearts_playerId');
    setGameState(null);
    setCurrentPlayerId(null);
  }, []);

  const currentPlayer = gameState?.players.find(p => p.id === currentPlayerId);

  return {
    gameState,
    currentPlayer,
    currentPlayerId,
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
  };
}
