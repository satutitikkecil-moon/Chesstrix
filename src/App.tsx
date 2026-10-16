import React, { useState } from 'react';
import { AndroidFrame } from './components/AndroidFrame.tsx';
import { StitchNavBar, NavTab } from './components/StitchNavBar.tsx';
import { LiveAssistant } from './components/LiveAssistant.tsx';
import { GameReview } from './components/GameReview.tsx';
import { OpeningsExplorer } from './components/OpeningsExplorer.tsx';
import { ChessComSync } from './components/ChessComSync.tsx';
import { AIAssistantDrawer } from './components/AIAssistantDrawer.tsx';
import { PlayerProfileModal } from './components/PlayerProfileModal.tsx';
import { SAMPLE_GAMES, analyzePgnGame, AnalyzedGame } from './utils/sampleGames.ts';
import { getActivePlayerUsername, setActivePlayerUsername } from './utils/playerStorage.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('assist');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [openingMovesToLoad, setOpeningMovesToLoad] = useState<string[] | null>(null);

  // AI Assistant and Player Manager Dialog States
  const [isCoachAiOpen, setIsCoachAiOpen] = useState<boolean>(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [activePlayer, setActivePlayer] = useState<string>(() => getActivePlayerUsername());

  const [coachAiData, setCoachAiData] = useState<{
    fen: string;
    turn: 'w' | 'b';
    evalScore: string;
    openingName?: string;
    moves: string[];
  }>({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    turn: 'w',
    evalScore: '+0.1',
    openingName: 'Standard Opening',
    moves: []
  });

  // Initialize with sample game 3 (Club player game with blunders to review)
  const [analyzedGame, setAnalyzedGame] = useState<AnalyzedGame>(() => {
    return analyzePgnGame(SAMPLE_GAMES[2]);
  });

  const handleAnalyzeGame = (game: AnalyzedGame) => {
    setAnalyzedGame(game);
    setActiveTab('review');
  };

  const handleSelectOpeningForBoard = (moves: string[]) => {
    setOpeningMovesToLoad(moves);
    setActiveTab('assist');
  };

  const handleTriggerCoachAi = (data?: {
    fen: string;
    turn: 'w' | 'b';
    evalScore: string;
    openingName?: string;
    moves: string[];
  }) => {
    if (data) {
      setCoachAiData(data);
    }
    setIsCoachAiOpen(true);
  };

  return (
    <AndroidFrame
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled(prev => !prev)}
      onOpenCoachAi={() => setIsCoachAiOpen(true)}
      onOpenPlayerManager={() => setIsPlayerModalOpen(true)}
    >
      {/* Screen Views */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {activeTab === 'assist' && (
          <LiveAssistant
            soundEnabled={soundEnabled}
            loadMoves={openingMovesToLoad}
            onClearLoadMoves={() => setOpeningMovesToLoad(null)}
            onJumpToReviewWithFen={() => setActiveTab('review')}
            onOpenCoachAi={handleTriggerCoachAi}
          />
        )}

        {activeTab === 'review' && (
          <GameReview
            analyzedGame={analyzedGame}
            soundEnabled={soundEnabled}
            onSelectAnotherGame={() => setActiveTab('chesscom')}
          />
        )}

        {activeTab === 'openings' && (
          <OpeningsExplorer
            onSelectOpeningForBoard={handleSelectOpeningForBoard}
          />
        )}

        {activeTab === 'chesscom' && (
          <ChessComSync
            onAnalyzeGame={handleAnalyzeGame}
          />
        )}
      </main>

      {/* Google Stitch / M3 Navigation Bar */}
      <StitchNavBar
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        unresolvedBlundersCount={analyzedGame.blundersList.length}
      />

      {/* Gemini AI Tactical Coach Assistant */}
      <AIAssistantDrawer
        isOpen={isCoachAiOpen}
        onClose={() => setIsCoachAiOpen(false)}
        fen={coachAiData.fen}
        turn={coachAiData.turn}
        evalScore={coachAiData.evalScore}
        openingName={coachAiData.openingName}
        recentMoves={coachAiData.moves}
      />

      {/* Player ID Management & Save Modal */}
      <PlayerProfileModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        onPlayerSelected={(username) => {
          setActivePlayer(username);
          setActivePlayerUsername(username);
        }}
      />
    </AndroidFrame>
  );
}
