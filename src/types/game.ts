export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type PlayerStatus = 'active' | 'eliminated' | 'spectator';

export type GamePhase = 'lobby' | 'playing' | 'voting' | 'results' | 'ended' | 'finished';

export interface Player {
  id: string;
  name: string;
  suit: Suit;
  isJack: boolean;
  isHost: boolean;
  status: PlayerStatus;
  lastVote?: Suit;
  eliminatedInRound?: number;
}

export interface RoundResult {
  round: number;
  eliminations: {
    playerId: string;
    playerName: string;
    guessedSuit: Suit;
    actualSuit: Suit;
  }[];
}

export interface GameState {
  id: string;
  phase: GamePhase;
  currentRound: number;
  roundStartTime: number;
  roundDuration: number; // in milliseconds (10 minutes = 600000)
  votingEndTime?: number;
  players: Player[];
  roundResults: RoundResult[];
  winner?: 'jack' | 'players' | null;
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const SUIT_NAMES: Record<Suit, string> = {
  hearts: 'Corazones',
  diamonds: 'Diamantes',
  clubs: 'Tréboles',
  spades: 'Picas',
};
