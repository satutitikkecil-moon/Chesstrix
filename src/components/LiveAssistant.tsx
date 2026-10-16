import React, { useState, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from './ChessBoard.tsx';
import { EvalBar } from './EvalBar.tsx';
import { 
  searchBestMove, 
  evaluatePosition, 
  detectTacticsAndThreats, 
  calculateTacticalEfficiency,
  formatEvaluation,
  TacticalThreat 
} from '../utils/chessEngine.ts';
import { findOpening, OpeningStat } from '../utils/openingsData.ts';
import { playChessSound } from '../utils/chessAudio.ts';
import { InGameAICoach } from './InGameAICoach.tsx';
import { 
  RotateCcw, 
  ArrowLeftRight, 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Lightbulb, 
  Dices,
  Info,
  Bot
} from 'lucide-react';

interface LiveAssistantProps {
  soundEnabled: boolean;
  loadMoves?: string[] | null;
  onClearLoadMoves?: () => void;
  onJumpToReviewWithFen?: (fen: string) => void;
  onOpenCoachAi?: (data: { fen: string; turn: 'w' | 'b'; evalScore: string; openingName?: string; moves: string[] }) => void;
}

export const LiveAssistant: React.FC<LiveAssistantProps> = ({
  soundEnabled,
  loadMoves,
  onClearLoadMoves,
  onJumpToReviewWithFen,
  onOpenCoachAi
}) => {
  const [chess] = useState<Chess>(() => new Chess());
  const [fen, setFen] = useState<string>(chess.fen());
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');
  const [historySan, setHistorySan] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [showBestArrow, setShowBestArrow] = useState<boolean>(true);
  const [showThreatArrow, setShowThreatArrow] = useState<boolean>(true);

  // If loadMoves is passed from OpeningsExplorer, load the move sequence
  useEffect(() => {
    if (loadMoves && loadMoves.length > 0) {
      chess.reset();
      for (const m of loadMoves) {
        try {
          chess.move(m);
        } catch {
          // ignore invalid
        }
      }
      setFen(chess.fen());
      setHistorySan(chess.history());
      const hist = chess.history({ verbose: true });
      if (hist.length > 0) {
        const last = hist[hist.length - 1];
        setLastMove({ from: last.from, to: last.to });
      } else {
        setLastMove(null);
      }
      if (onClearLoadMoves) onClearLoadMoves();
    }
  }, [loadMoves, chess, onClearLoadMoves]);

  // Engine evaluation
  const engineResult = useMemo(() => {
    const score = evaluatePosition(chess);
    const search = searchBestMove(chess, 2);
    const threats = detectTacticsAndThreats(chess);
    const efficiency = calculateTacticalEfficiency(score, threats.length, chess.turn());

    let advice = 'Posisikan perwira untuk mengontrol petak sentral dan amankan raja.';
    if (threats.length > 0) {
      advice = `Perhatian: ${threats[0].description}`;
    } else if (search.bestMove) {
      advice = `Langkah rekomendasi ${search.bestMove.san} memaksimalkan inisiatif dan koordinasi perwira.`;
    }

    return {
      score,
      evalString: formatEvaluation(score),
      bestMove: search.bestMove,
      line: search.line,
      threats,
      efficiency,
      advice
    };
  }, [fen, chess]);

  // Detected opening
  const opening = useMemo<OpeningStat | null>(() => {
    return findOpening(historySan);
  }, [historySan]);

  const handleMakeMove = (moveData: { from: string; to: string; promotion?: string }) => {
    try {
      const move = chess.move({
        from: moveData.from,
        to: moveData.to,
        promotion: moveData.promotion || 'q'
      });

      if (move) {
        setFen(chess.fen());
        setLastMove({ from: move.from, to: move.to });
        setHistorySan(chess.history());

        if (soundEnabled) {
          if (chess.inCheck()) {
            playChessSound('check');
          } else if (move.captured) {
            playChessSound('capture');
          } else {
            playChessSound('move');
          }
        }
      }
    } catch (e) {
      console.warn('Invalid move attempted:', e);
    }
  };

  const handleUndo = () => {
    const undone = chess.undo();
    if (undone) {
      setFen(chess.fen());
      setHistorySan(chess.history());
      const hist = chess.history({ verbose: true });
      if (hist.length > 0) {
        const last = hist[hist.length - 1];
        setLastMove({ from: last.from, to: last.to });
      } else {
        setLastMove(null);
      }
      if (soundEnabled) playChessSound('move');
    }
  };

  const handleReset = () => {
    chess.reset();
    setFen(chess.fen());
    setHistorySan([]);
    setLastMove(null);
    if (soundEnabled) playChessSound('move');
  };

  const handleFlip = () => {
    setOrientation(prev => prev === 'w' ? 'b' : 'w');
  };

  // Load tactical test presets
  const handleLoadPreset = (type: 'sicilian' | 'puzzle_fork' | 'endgame') => {
    chess.reset();
    if (type === 'sicilian') {
      chess.load('r1bqkb1r/pp2pppp/2np1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 2 6');
    } else if (type === 'puzzle_fork') {
      chess.load('r1bqk2r/pppp1ppp/2n5/4p3/1bB1n3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 6');
    } else if (type === 'endgame') {
      chess.load('8/5pk1/6p1/7p/4RP1P/6P1/r7/5K2 w - - 0 45');
    }
    setFen(chess.fen());
    setHistorySan(chess.history());
    setLastMove(null);
    if (soundEnabled) playChessSound('move');
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3 overflow-y-auto">
      {/* Top Header & Turn Indicator */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-3.5 h-3.5 rounded-full border border-slate-600 ${chess.turn() === 'w' ? 'bg-white' : 'bg-slate-950'}`} />
          <span className="text-xs font-semibold text-slate-200">
            Giliran: {chess.turn() === 'w' ? 'Putih' : 'Hitam'}
          </span>
          {chess.inCheck() && (
            <span className="text-[11px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-md">
              SKAK!
            </span>
          )}
        </div>

        {/* Tactical Efficiency Gauge */}
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <div className="text-right">
            <span className="text-[11px] text-slate-400">Efisiensi: </span>
            <span className={`text-xs font-mono font-bold ${
              engineResult.efficiency >= 70 ? 'text-emerald-400' : (engineResult.efficiency >= 45 ? 'text-amber-400' : 'text-rose-400')
            }`}>
              {engineResult.efficiency}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Board Row: Eval bar + 8x8 Chessboard */}
      <div className="flex items-center justify-center gap-2.5 w-full">
        <EvalBar score={engineResult.score} orientation={orientation} />

        <div className="flex-1 max-w-[370px]">
          <ChessBoard
            fen={fen}
            orientation={orientation}
            lastMove={lastMove}
            bestMoveArrow={showBestArrow && engineResult.bestMove ? { from: engineResult.bestMove.from, to: engineResult.bestMove.to } : null}
            threatArrow={showThreatArrow && engineResult.threats.length > 0 && engineResult.threats[0].sourceSquare ? { from: engineResult.threats[0].sourceSquare, to: engineResult.threats[0].targetSquare } : null}
            interactive={true}
            onMove={handleMakeMove}
            checkSquare={chess.inCheck() ? (chess.turn() === 'w' ? 'e1' : 'e8') : null}
          />
        </div>
      </div>

      {/* Quick Board Action Toolbar */}
      <div className="flex items-center justify-between gap-1.5 px-1">
        <button
          type="button"
          onClick={handleFlip}
          className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Putar Papan"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
          <span>Putar</span>
        </button>

        <button
          type="button"
          onClick={handleUndo}
          className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Tarik Langkah Terakhir"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Undo</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Reset Papan dari Awal"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={() => setShowBestArrow(!showBestArrow)}
          className={`flex-1 min-h-[44px] flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl border text-xs transition-colors cursor-pointer ${
            showBestArrow ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
          title="Tampilkan Panah Rekomendasi Langkah"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Panah</span>
        </button>
      </div>

      {/* In-Game AI Assistant Coach (Live on Board) */}
      <InGameAICoach
        fen={fen}
        turn={chess.turn()}
        evalScore={engineResult.evalString}
        openingName={opening?.name}
        recentMoves={historySan}
        bestMoveSan={engineResult.bestMove?.san}
        bestMoveFromTo={engineResult.bestMove ? { from: engineResult.bestMove.from, to: engineResult.bestMove.to } : null}
        threats={engineResult.threats}
        soundEnabled={soundEnabled}
        onPlayMove={(move) => {
          handleMakeMove({
            from: move.from,
            to: move.to
          });
        }}
      />



      {/* Opening Database Match (If current move sequence matches ECO) */}
      {opening && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold">
                {opening.eco}
              </span>
              <span className="text-xs font-semibold text-slate-200 truncate">
                {opening.name}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">{opening.totalGames.toLocaleString()} Game</span>
          </div>

          {/* Master Win/Draw/Loss Bar */}
          <div className="w-full h-2 rounded-full overflow-hidden flex mb-2 bg-slate-800">
            <div style={{ width: `${opening.whiteWin}%` }} className="bg-white" title={`Putih Menang: ${opening.whiteWin}%`} />
            <div style={{ width: `${opening.draw}%` }} className="bg-slate-500" title={`Remis: ${opening.draw}%`} />
            <div style={{ width: `${opening.blackWin}%` }} className="bg-slate-950" title={`Hitam Menang: ${opening.blackWin}%`} />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Putih {opening.whiteWin}%</span>
            <span>Remis {opening.draw}%</span>
            <span>Hitam {opening.blackWin}%</span>
          </div>

          <p className="mt-2 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">
            <span className="font-semibold text-slate-300">Rencana Strategis: </span>
            {opening.strategyOverview}
          </p>
        </div>
      )}

      {/* Quick Presets for Instant Testing */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-2.5">
        <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
          Muat Contoh Posisi Taktis:
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleLoadPreset('sicilian')}
            className="min-h-[44px] py-1 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors text-center cursor-pointer"
          >
            Najdorf B90
          </button>
          <button
            type="button"
            onClick={() => handleLoadPreset('puzzle_fork')}
            className="min-h-[44px] py-1 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors text-center cursor-pointer"
          >
            Taktik Garpu
          </button>
          <button
            type="button"
            onClick={() => handleLoadPreset('endgame')}
            className="min-h-[44px] py-1 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors text-center cursor-pointer"
          >
            Endgame Benteng
          </button>
        </div>
      </div>
    </div>
  );
};
