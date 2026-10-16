import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  X, 
  Lightbulb, 
  ShieldAlert, 
  Target, 
  Compass, 
  RefreshCw,
  HelpCircle
} from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fen: string;
  turn: 'w' | 'b';
  evalScore: string;
  openingName?: string;
  recentMoves?: string[];
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  fen,
  turn,
  evalScore,
  openingName,
  recentMoves = []
}) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [userQuery, setUserQuery] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const quickPrompts = [
    'Saran langkah terbaik & alasan taktisnya',
    'Rencana strategis & struktur bidak',
    'Apakah ada ancaman lawan yang berbahaya?',
    'Bagaimana cara memanfaatkan kelemahan lawan?'
  ];

  const handleAskCoach = async (customPrompt?: string) => {
    const query = customPrompt || userQuery;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen,
          turn,
          evalScore,
          openingName,
          moves: recentMoves,
          question: query || 'Berikan analisis taktis komprehensif dan saran langkah terbaik untuk posisi ini.'
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setAdvice(data.advice);
      if (customPrompt) setUserQuery('');
    } catch (err: any) {
      console.warn('AI Coach request failed:', err);
      setErrorMsg('Koneksi AI sedang sibuk. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch initial advice when opened if not yet loaded
  React.useEffect(() => {
    if (isOpen && !advice && !loading) {
      handleAskCoach('Berikan analisis taktis komprehensif dan saran langkah terbaik.');
    }
  }, [isOpen, fen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Coach AI Grandmaster
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Gemini 3.8 Flash
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block font-mono">
                Giliran: {turn === 'w' ? 'Putih' : 'Hitam'} · Eval: {evalScore}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Coach AI"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Prompts Chips */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto pb-2">
          {quickPrompts.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAskCoach(promptText)}
              disabled={loading}
              className="min-h-[38px] px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-[11px] text-slate-300 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {loading && (
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>Grandmaster AI sedang menganalisis posisi dan struktur taktis...</span>
              </div>
              <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-slate-800 rounded animate-pulse w-full" />
              <div className="h-4 bg-slate-800 rounded animate-pulse w-5/6" />
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-950/30 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {!loading && advice && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-inner">
              <div className="whitespace-pre-wrap text-xs text-slate-200 leading-relaxed font-sans space-y-2">
                {advice}
              </div>
            </div>
          )}
        </div>

        {/* Interactive Query Input */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userQuery.trim()) {
                handleAskCoach();
              }
            }}
            placeholder="Tanyakan analisis taktis spesifik..."
            disabled={loading}
            className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />

          <button
            type="button"
            onClick={() => handleAskCoach()}
            disabled={loading || !userQuery.trim()}
            aria-label="Kirim Pertanyaan"
            className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
