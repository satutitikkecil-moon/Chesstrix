import React, { useState, useMemo } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from './ChessBoard.tsx';
import { EvalBar } from './EvalBar.tsx';
import { AnalyzedGame, SAMPLE_GAMES, analyzePgnGame } from '../utils/sampleGames.ts';
import { MoveAnalysis, MoveClassification } from '../utils/chessEngine.ts';
import { playChessSound } from '../utils/chessAudio.ts';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  TrendingDown,
  RefreshCw,
  Trophy,
  Award
} from 'lucide-react';

interface GameReviewProps {
  analyzedGame: AnalyzedGame;
  soundEnabled: boolean;
  onSelectAnotherGame?: () => void;
}

export const GameReview: React.FC<GameReviewProps> = ({
  analyzedGame,
  soundEnabled,
  onSelectAnotherGame
}) => {
  const [currentPlyIndex, setCurrentPlyIndex] = useState<number>(0);
  const [retryMode, setRetryMode] = useState<boolean>(false);
  const [retryFeedback, setRetryFeedback] = useState<{ success?: boolean; message: string } | null>(null);

  const totalPlies = analyzedGame.moves.length;
  const currentMove = analyzedGame.moves[currentPlyIndex] || analyzedGame.moves[0];

  // Current FEN at this ply
  const currentFen = currentMove ? currentMove.fenAfter : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  // Navigation handlers
  const handleFirst = () => {
    setCurrentPlyIndex(0);
    setRetryMode(false);
    setRetryFeedback(null);
    if (soundEnabled) playChessSound('move');
  };

  const handlePrev = () => {
    if (currentPlyIndex > 0) {
      setCurrentPlyIndex(currentPlyIndex - 1);
      setRetryMode(false);
      setRetryFeedback(null);
      if (soundEnabled) playChessSound('move');
    }
  };

  const handleNext = () => {
    if (currentPlyIndex < totalPlies - 1) {
      setCurrentPlyIndex(currentPlyIndex + 1);
      setRetryMode(false);
      setRetryFeedback(null);
      if (soundEnabled) playChessSound('move');
    }
  };

  const handleLast = () => {
    setCurrentPlyIndex(totalPlies - 1);
    setRetryMode(false);
    setRetryFeedback(null);
    if (soundEnabled) playChessSound('move');
  };

  const handleJumpToMove = (index: number) => {
    setCurrentPlyIndex(index);
    setRetryMode(false);
    setRetryFeedback(null);
    if (soundEnabled) playChessSound('move');
  };

  // Blunder retry solver
  const handleStartRetry = () => {
    setRetryMode(true);
    setRetryFeedback(null);
  };

  const handleRetryMove = (moveData: { from: string; to: string }) => {
    if (!currentMove) return;

    // Check if user played the best move
    if (
      (moveData.from === currentMove.bestMoveFrom && moveData.to === currentMove.bestMoveTo) ||
      (currentMove.bestMoveSan.toLowerCase().includes(moveData.to.toLowerCase()))
    ) {
      setRetryFeedback({
        success: true,
        message: `Luar biasa! ${currentMove.bestMoveSan} adalah langkah terbaik yang tepat untuk membalikkan posisi!`
      });
      if (soundEnabled) playChessSound('success');
    } else {
      setRetryFeedback({
        success: false,
        message: `Langkah kurang tepat. Perhatikan taktik yang lebih aktif atau ancaman perwira!`
      });
      if (soundEnabled) playChessSound('blunder');
    }
  };

  // Badge stylings
  const getBadgeStyle = (classification: MoveClassification) => {
    switch (classification) {
      case 'brilliant':
        return { label: 'Brilian', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40', icon: '🌟' };
      case 'great':
        return { label: 'Hebat', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: '🎯' };
      case 'best':
        return { label: 'Terbaik', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '✨' };
      case 'good':
        return { label: 'Bagus', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '👍' };
      case 'book':
        return { label: 'Buku Teori', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '📖' };
      case 'inaccuracy':
        return { label: 'Kurang Akurat', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: '⚠️' };
      case 'mistake':
        return { label: 'Kesalahan', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/40', icon: '❓' };
      case 'blunder':
        return { label: 'Blunder', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40', icon: '❌' };
      case 'missed_win':
        return { label: 'Kemenangan Terlewat', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/40', icon: '🕊️' };
    }
  };

  // Build SVG evaluation graph points
  const evalGraphSvg = useMemo(() => {
    if (analyzedGame.moves.length === 0) return '';
    const width = 360;
    const height = 64;
    const midY = height / 2;
    const stepX = width / Math.max(1, analyzedGame.moves.length - 1);

    const points = analyzedGame.moves.map((m, idx) => {
      const x = idx * stepX;
      // Clamp eval between -600 and +600 for graph display
      const clamped = Math.max(-600, Math.min(600, m.evalAfter));
      // White advantage goes UP (-y), Black goes DOWN (+y)
      const y = midY - (clamped / 600) * (midY - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return points.join(' ');
  }, [analyzedGame.moves]);

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3 overflow-y-auto">
      {/* Game Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>{analyzedGame.metadata.event}</span>
          <span className="font-mono text-emerald-400">{analyzedGame.metadata.result}</span>
        </div>

        {/* Players comparison */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white border border-slate-500" />
            <div>
              <span className="text-xs font-bold text-slate-100 block">
                {analyzedGame.metadata.white.username}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {analyzedGame.metadata.white.rating}
              </span>
            </div>
          </div>

          <div className="text-center px-2">
            <span className="text-[10px] text-slate-500 font-semibold block">VS</span>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div>
              <span className="text-xs font-bold text-slate-100 block">
                {analyzedGame.metadata.black.username}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {analyzedGame.metadata.black.rating}
              </span>
            </div>
            <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-600" />
          </div>
        </div>

        {/* CAPS Accuracy Score Cards */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800">
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 text-center">
            <span className="text-[10px] text-slate-400 block">Akurasi Putih</span>
            <span className="text-sm font-mono font-extrabold text-emerald-400">
              {analyzedGame.whiteAccuracy}%
            </span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 text-center">
            <span className="text-[10px] text-slate-400 block">Akurasi Hitam</span>
            <span className="text-sm font-mono font-extrabold text-cyan-400">
              {analyzedGame.blackAccuracy}%
            </span>
          </div>
        </div>
      </div>

      {/* Evaluation Momentum Graph */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span className="font-semibold text-slate-300">Grafik Momentum Evaluasi</span>
          <span className="font-mono text-emerald-400">Langkah {currentMove ? currentMove.ply : 0}/{totalPlies}</span>
        </div>

        <div className="relative w-full h-16 bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80">
          {/* Midline (equality) */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700/60 -translate-y-1/2 pointer-events-none" />

          {/* SVG Graph line */}
          <svg className="w-full h-full" viewBox="0 0 360 64" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={evalGraphSvg}
            />
          </svg>

          {/* Current cursor scrubber */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] pointer-events-none"
            style={{
              left: `${(currentPlyIndex / Math.max(1, totalPlies - 1)) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Main Board Row: Eval bar + Chessboard */}
      <div className="flex items-center justify-center gap-2.5 w-full">
        <EvalBar score={currentMove ? currentMove.evalAfter : 0} />

        <div className="flex-1 max-w-[370px]">
          <ChessBoard
            fen={retryMode && currentMove ? currentMove.fenBefore : currentFen}
            orientation="w"
            lastMove={retryMode ? null : (currentMove ? { from: currentMove.from, to: currentMove.to } : null)}
            bestMoveArrow={
              retryMode || !currentMove
                ? null
                : (currentMove.classification === 'blunder' || currentMove.classification === 'mistake'
                    ? { from: currentMove.bestMoveFrom, to: currentMove.bestMoveTo }
                    : null)
            }
            interactive={retryMode}
            onMove={retryMode ? handleRetryMove : undefined}
          />
        </div>
      </div>

      {/* Move Timeline Scrubber Toolbar */}
      <div className="flex items-center justify-between gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
        <button
          type="button"
          onClick={handleFirst}
          disabled={currentPlyIndex === 0}
          aria-label="Langkah Pertama"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-40 text-slate-300 cursor-pointer"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPlyIndex === 0}
          aria-label="Langkah Sebelumnya"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-40 text-slate-300 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Current Move Details */}
        {currentMove && (
          <div className="flex-1 text-center px-1">
            <div className="flex items-center justify-center gap-1.5">
              <span className="font-mono text-xs text-slate-400">
                {currentMove.color === 'w' ? `${currentMove.moveNumber}.` : `${currentMove.moveNumber}...`}
              </span>
              <span className="font-mono text-sm font-bold text-white">
                {currentMove.san}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">
              Eval: {currentMove.evalString}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPlyIndex >= totalPlies - 1}
          aria-label="Langkah Berikutnya"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-40 text-slate-300 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleLast}
          disabled={currentPlyIndex >= totalPlies - 1}
          aria-label="Langkah Terakhir"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-40 text-slate-300 cursor-pointer"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>

      {/* Move Classification & Coach Review Card */}
      {currentMove && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            {(() => {
              const badge = getBadgeStyle(currentMove.classification);
              return (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${badge.bg}`}>
                  <span>{badge.icon}</span>
                  <span>{badge.label}</span>
                </div>
              );
            })()}

            {/* Quick jump to blunder retry */}
            {(currentMove.classification === 'blunder' || currentMove.classification === 'mistake' || currentMove.classification === 'inaccuracy') && (
              <button
                type="button"
                onClick={handleStartRetry}
                className="min-h-[44px] px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-transform active:scale-95 flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Perbaiki Langkah</span>
              </button>
            )}
          </div>

          {/* Explanation */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <p className="text-xs text-slate-200 leading-relaxed">
              {currentMove.explanation}
            </p>
            {currentMove.classification !== 'best' && currentMove.classification !== 'brilliant' && currentMove.bestMoveSan !== currentMove.san && (
              <p className="text-[11px] text-emerald-400 font-mono mt-2 font-semibold">
                Langkah Terbaik Mesin: {currentMove.bestMoveSan}
              </p>
            )}
          </div>

          {/* Retry Mode Feedback (If active) */}
          {retryMode && (
            <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/40 animate-fade-in">
              <span className="text-xs font-semibold text-emerald-400 block mb-1">
                Mode Latihan: Gerakkan bidak/perwira di papan!
              </span>
              <p className="text-[11px] text-slate-400 mb-2">
                Temukan langkah alternatif yang lebih baik daripada {currentMove.san}.
              </p>

              {retryFeedback && (
                <div
                  className={`p-2 rounded-lg text-xs font-semibold flex items-start gap-2 ${
                    retryFeedback.success
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {retryFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{retryFeedback.message}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Blunders & Mistakes Quick List */}
      {analyzedGame.blundersList.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              Daftar Evaluasi Langkah Kritis ({analyzedGame.blundersList.length})
            </span>
            <span className="text-[10px] text-slate-400">Ketuk untuk meninjau</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {analyzedGame.blundersList.map((blunder) => {
              const badge = getBadgeStyle(blunder.classification);
              const isActive = blunder.ply - 1 === currentPlyIndex;

              return (
                <button
                  key={blunder.ply}
                  type="button"
                  onClick={() => handleJumpToMove(blunder.ply - 1)}
                  className={`w-full min-h-[44px] flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-slate-800 border-emerald-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{badge.icon}</span>
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {blunder.color === 'w' ? `${blunder.moveNumber}. ` : `${blunder.moveNumber}... `}
                        {blunder.san}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Solusi: {blunder.bestMoveSan}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${badge.bg}`}>
                    {badge.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
