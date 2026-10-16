import React from 'react';
import { formatEvaluation } from '../utils/chessEngine.ts';

interface EvalBarProps {
  score: number; // centipawns from White perspective
  orientation?: 'w' | 'b';
}

export const EvalBar: React.FC<EvalBarProps> = ({ score, orientation = 'w' }) => {
  // Clamp score between -1000 and +1000 for standard display bar
  // Score 0 -> 50% white, +500 -> 75% white, -500 -> 25% white
  const clamped = Math.max(-1000, Math.min(1000, score));
  // Convert to 0 - 100% white height
  let whitePercentage = 50 + (clamped / 1000) * 45;
  if (score >= 20000) whitePercentage = 100;
  if (score <= -20000) whitePercentage = 0;

  const displayString = formatEvaluation(score);

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div 
        className="relative w-4.5 sm:w-5 h-72 sm:h-96 rounded-full overflow-hidden bg-slate-900 border border-slate-700/80 shadow-inner flex flex-col justify-end"
        title={`Evaluasi: ${displayString}`}
      >
        {/* Black side on top */}
        <div className="absolute inset-x-0 top-0 bg-slate-900 transition-all duration-300" />

        {/* White side on bottom */}
        <div
          className="w-full bg-white transition-all duration-300 ease-out"
          style={{
            height: `${orientation === 'w' ? whitePercentage : 100 - whitePercentage}%`
          }}
        />

        {/* Center line (balance mark) */}
        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-slate-500/50 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Numeric Score Tag */}
      <span className="text-[11px] font-mono font-bold tracking-tight px-1 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
        {displayString}
      </span>
    </div>
  );
};
