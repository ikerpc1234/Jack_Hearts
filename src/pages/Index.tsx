import { useGameState } from '@/hooks/useGameState';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { LobbyScreen } from '@/components/screens/LobbyScreen';
import { GameScreen } from '@/components/screens/GameScreen';
import { ResultsScreen } from '@/components/screens/ResultsScreen';

const Index = () => {
  const {
    gameState,
    currentPlayer,
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
  } = useGameState();

  // No game state - show home screen
  if (!gameState || !currentPlayer) {
    return (
      <HomeScreen
        onCreateGame={(name) => createGame(name)}
        onJoinGame={(name) => joinGame(name)}
        hasExistingGame={!!gameState}
      />
    );
  }

  // Lobby phase
  if (gameState.phase === 'lobby') {
    return (
      <LobbyScreen
        gameId={gameState.id}
        players={gameState.players}
        currentPlayer={currentPlayer}
        onStartGame={startGame}
        onRemovePlayer={removePlayer}
        onLeave={resetGame}
      />
    );
  }

  // Playing or Voting phase
  if (gameState.phase === 'playing' || gameState.phase === 'voting') {
    return (
      <GameScreen
        gameState={gameState}
        currentPlayer={currentPlayer}
        onStartVoting={startVoting}
        onVote={(suit) => submitVote(currentPlayer.id, suit)}
        onProcessResults={processRoundResults}
        onEndGame={() => endGame('players')}
      />
    );
  }

  // Results phase (after round or game ended)
  if (gameState.phase === 'results' || gameState.phase === 'ended') {
    return (
      <ResultsScreen
        gameState={gameState}
        currentPlayer={currentPlayer}
        onContinue={gameState.phase === 'results' ? continueToNextRound : undefined}
        onNewGame={resetGame}
      />
    );
  }

  return null;
};

export default Index;
