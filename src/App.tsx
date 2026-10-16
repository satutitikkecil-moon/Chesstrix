import React, { useState } from 'react';
import { AndroidFrame } from './components/AndroidFrame.tsx';
import { StitchNavBar, NavTab } from './components/StitchNavBar.tsx';
import { LiveAssistant } from './components/LiveAssistant.tsx';
import { GameReview } from './components/GameReview.tsx';
import { OpeningsExplorer } from './components/OpeningsExplorer.tsx';
import { ChessComSync } from './components/ChessComSync.tsx';
import { SAMPLE_GAMES, analyzePgnGame, AnalyzedGame } from './utils/sampleGames.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('assist');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [openingMovesToLoad, setOpeningMovesToLoad] = useState<string[] | null>(null);

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

  return (
    <AndroidFrame
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled(prev => !prev)}
    >
      {/* Screen Views */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {activeTab === 'assist' && (
          <LiveAssistant
            soundEnabled={soundEnabled}
            loadMoves={openingMovesToLoad}
            onClearLoadMoves={() => setOpeningMovesToLoad(null)}
            onJumpToReviewWithFen={() => setActiveTab('review')}
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
    </AndroidFrame>
  );
}
