import React, { useState } from 'react';
import { OPENINGS_DATABASE, OpeningStat } from '../utils/openingsData.ts';
import { Search, Compass, BookOpen, Shield, Swords, ArrowRight } from 'lucide-react';

interface OpeningsExplorerProps {
  onSelectOpeningForBoard: (moves: string[]) => void;
}

export const OpeningsExplorer: React.FC<OpeningsExplorerProps> = ({
  onSelectOpeningForBoard
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOpening, setSelectedOpening] = useState<OpeningStat>(OPENINGS_DATABASE[0]);

  const filteredOpenings = OPENINGS_DATABASE.filter(o => 
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.eco.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.moves.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3 overflow-y-auto">
      {/* Search Bar */}
      <div className="relative">
        <label htmlFor="opening-search" className="sr-only">Cari Pembukaan ECO</label>
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="opening-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari pembukaan (ECO, nama, langkah)..."
          className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
        />
      </div>

      {/* Selected Opening Deep Strategy Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {selectedOpening.eco}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {selectedOpening.totalGames.toLocaleString()} Master Games
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelectOpeningForBoard(selectedOpening.movesArray)}
            className="min-h-[44px] px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-md"
          >
            <span>Uji di Papan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="text-base font-bold text-white mb-1">
          {selectedOpening.name}
        </h3>
        <p className="font-mono text-xs text-slate-400 mb-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          {selectedOpening.moves}
        </p>

        {/* Statistical Win/Draw/Loss Distribution */}
        <div className="mb-3">
          <span className="text-[11px] text-slate-400 block mb-1">
            Distribusi Hasil Pertandingan Tingkat Master:
          </span>
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800 shadow-inner">
            <div style={{ width: `${selectedOpening.whiteWin}%` }} className="bg-white" title={`Putih Menang: ${selectedOpening.whiteWin}%`} />
            <div style={{ width: `${selectedOpening.draw}%` }} className="bg-slate-500" title={`Remis: ${selectedOpening.draw}%`} />
            <div style={{ width: `${selectedOpening.blackWin}%` }} className="bg-slate-950" title={`Hitam Menang: ${selectedOpening.blackWin}%`} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-300 font-mono mt-1">
            <span>Putih {selectedOpening.whiteWin}%</span>
            <span>Remis {selectedOpening.draw}%</span>
            <span>Hitam {selectedOpening.blackWin}%</span>
          </div>
        </div>

        {/* Strategic Game Plan */}
        <div className="space-y-2 border-t border-slate-800 pt-3">
          <div className="flex items-start gap-2">
            <Compass className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Rencana Strategis Utama</span>
              <p className="text-[12px] text-slate-300 leading-relaxed">
                {selectedOpening.strategyOverview}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Struktur Bidak</span>
              <p className="text-[12px] text-slate-300 leading-relaxed">
                {selectedOpening.pawnStructure}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Swords className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Motif Taktis Kunci</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedOpening.keyTactics.map((tac, idx) => (
                  <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {tac}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Openings Catalog List */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-slate-400 px-1">
          Katalog Pembukaan Master ({filteredOpenings.length})
        </span>

        {filteredOpenings.map((opening) => {
          const isSelected = opening.eco === selectedOpening.eco;
          return (
            <button
              key={opening.eco}
              type="button"
              onClick={() => setSelectedOpening(opening)}
              className={`w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500/50 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[11px] font-bold text-emerald-400">
                    {opening.eco}
                  </span>
                  <span className="text-xs font-bold text-slate-100">
                    {opening.name}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono truncate block max-w-xs">
                  {opening.moves}
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block">W / D / B</span>
                <span className="text-[11px] font-mono text-slate-300">
                  {opening.whiteWin}% / {opening.draw}% / {opening.blackWin}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
