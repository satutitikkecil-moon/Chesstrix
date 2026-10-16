import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Lightbulb, 
  ShieldAlert, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  MessageSquare, 
  RefreshCw,
  HelpCircle,
  Volume2
} from 'lucide-react';
import type { TacticalThreat } from '../utils/chessEngine.ts';
import { playChessSound } from '../utils/chessAudio.ts';

interface InGameAICoachProps {
  fen: string;
  turn: 'w' | 'b';
  evalScore: string;
  openingName?: string;
  recentMoves: string[];
  bestMoveSan?: string;
  bestMoveFromTo?: { from: string; to: string } | null;
  threats: TacticalThreat[];
  onPlayMove?: (move: { from: string; to: string }) => void;
  soundEnabled?: boolean;
}

interface MessageItem {
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const InGameAICoach: React.FC<InGameAICoachProps> = ({
  fen,
  turn,
  evalScore,
  openingName,
  recentMoves = [],
  bestMoveSan,
  bestMoveFromTo,
  threats,
  onPlayMove,
  soundEnabled = true
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [autoCoach, setAutoCoach] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [userQuery, setUserQuery] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [showChatHistory, setShowChatHistory] = useState<boolean>(false);
  
  const lastAnalyzedFen = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const quickPrompts = [
    '💡 Mengapa langkah ini terbaik?',
    '🛡️ Apa ancaman lawan sekarang?',
    '⚔️ Bagaimana cara menyerang?',
    '👑 Cek keamanan raja'
  ];

  // Request advice from API / Gemini or generate immediate tactical GM advice
  const fetchAdvice = async (question?: string, isUserMessage = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    const queryText = question || (
      bestMoveSan 
        ? `Evaluasi langkah terbaik ${bestMoveSan} dan jelaskan rencana taktisnya.`
        : 'Berikan evaluasi posisi saat ini dan saran langkah terbaik.'
    );

    if (isUserMessage && question) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'user',
          text: question,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          fen,
          turn,
          evalScore,
          openingName,
          moves: recentMoves,
          question: queryText
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const responseText = data.advice || 'Posisi stabil. Amankan perwira dan pertahankan kontrol sentral.';
      
      setAiAdvice(responseText);
      lastAnalyzedFen.current = fen;

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      if (soundEnabled && isUserMessage) {
        playChessSound('best');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('In-game AI Coach request fallback:', err);
      // Fallback instantaneous GM advice
      const side = turn === 'w' ? 'Putih' : 'Hitam';
      const fallback = `💡 Analisis Taktis In-Game (${side}):\n${
        bestMoveSan ? `Rekomendasi langkah ${bestMoveSan} memaksimalkan koordinasi perwira.` : 'Kembangkan perwira aktif.'
      }\n🎯 Evaluasi: ${evalScore}. Pertahankan struktur pion kokoh.\n⚠️ Waspadai taktik lawan dan periksa selalu petak yang tidak terjaga.`;
      setAiAdvice(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically update in-game advice on FEN change when autoCoach is on
  useEffect(() => {
    if (!autoCoach) return;
    if (fen === lastAnalyzedFen.current) return;

    const timer = setTimeout(() => {
      fetchAdvice();
    }, 450);

    return () => clearTimeout(timer);
  }, [fen, autoCoach, bestMoveSan]);

  const handleSendQuery = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userQuery.trim() || isLoading) return;
    const q = userQuery.trim();
    setUserQuery('');
    fetchAdvice(q, true);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/40 border border-emerald-500/40 rounded-2xl shadow-xl overflow-hidden transition-all duration-200">
      {/* In-Game AI Coach Header */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Bot className="w-4 h-4 text-slate-950" />
            </div>
            {/* Online Pulse Dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">
                Assistant AI In-Game
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE GM
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block font-mono">
              {isLoading ? (
                <span className="text-emerald-400 animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Menganalisis langkah...
                </span>
              ) : (
                `Giliran: ${turn === 'w' ? 'Putih' : 'Hitam'} · Eval: ${evalScore}`
              )}
            </span>
          </div>
        </div>

        {/* Controls: Auto-Coach Toggle & Expand */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAutoCoach(!autoCoach)}
            className={`min-h-[34px] px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
              autoCoach
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={autoCoach ? 'Auto-Coach Aktif (Memberi saran setiap langkah)' : 'Auto-Coach Nonaktif'}
          >
            <Zap className={`w-3 h-3 ${autoCoach ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="hidden xs:inline">Auto-Coach</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Kecilkan Assistant' : 'Perbesar Assistant'}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Recommended Move Ticker Row (Always visible for fast action) */}
      {bestMoveSan && (
        <div className="px-3 py-2 bg-emerald-950/20 border-b border-emerald-500/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Saran Langkah:
            </span>
            <span className="text-base font-mono font-extrabold text-white bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
              {bestMoveSan}
            </span>
            {bestMoveFromTo && (
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                ({bestMoveFromTo.from} → {bestMoveFromTo.to})
              </span>
            )}
          </div>

          {onPlayMove && bestMoveFromTo && (
            <button
              type="button"
              onClick={() => {
                onPlayMove(bestMoveFromTo);
                if (soundEnabled) playChessSound('best');
              }}
              className="min-h-[36px] px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-transform active:scale-95 shadow flex items-center gap-1 cursor-pointer"
            >
              <span>Mainkan</span>
              <span>⚡</span>
            </button>
          )}
        </div>
      )}

      {/* Expanded Coaching Body */}
      {isExpanded && (
        <div className="p-3.5 space-y-3">
          {/* Real-time Advice Speech Box */}
          <div className="relative bg-slate-950/80 border border-slate-800 rounded-xl p-3 shadow-inner">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Lightbulb className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-emerald-300">
                    Instruksi Taktis Coach AI:
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchAdvice()}
                    disabled={isLoading}
                    className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Perbarui</span>
                  </button>
                </div>

                {isLoading && !aiAdvice ? (
                  <div className="space-y-1.5 py-1">
                    <div className="h-3 bg-slate-800 rounded animate-pulse w-4/5" />
                    <div className="h-3 bg-slate-800 rounded animate-pulse w-3/5" />
                  </div>
                ) : (
                  <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {aiAdvice || 'Posisi awal. Kembangkan perwira sayap raja dan kuasai empat petak sentral (e4, d4, e5, d5).'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tactical Threat Warning if active */}
          {threats.length > 0 && (
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-2.5 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200">
                <span className="font-bold text-rose-400 block mb-0.5">Peringatan Bahaya Taktis:</span>
                {threats[0].description}
              </div>
            </div>
          )}

          {/* Quick Prompts Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => fetchAdvice(q, true)}
                disabled={isLoading}
                className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-[11px] text-slate-300 whitespace-nowrap shrink-0 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* In-Game Question Bar */}
          <form onSubmit={handleSendQuery} className="flex items-center gap-1.5 pt-1">
            <div className="relative flex-1">
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Tanya Coach AI di tengah game (misal: aman rokade?)..."
                disabled={isLoading}
                className="w-full min-h-[40px] px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!userQuery.trim() || isLoading}
              aria-label="Kirim Pertanyaan ke AI"
              className="min-h-[40px] px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-transform active:scale-95 cursor-pointer shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Tanya</span>
            </button>
          </form>

          {/* Toggle Conversation History */}
          {messages.length > 1 && (
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setShowChatHistory(!showChatHistory)}
                className="text-[11px] text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3 h-3 text-emerald-400" />
                <span>{showChatHistory ? 'Sembunyikan Riwayat Tanya Jawab' : `Lihat Riwayat Tanya Jawab (${messages.length})`}</span>
              </button>
            </div>
          )}

          {/* Expanded Chat Log */}
          {showChatHistory && (
            <div className="max-h-48 overflow-y-auto space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg text-xs ${
                    m.sender === 'user'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 ml-4'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-bold">{m.sender === 'user' ? 'Anda' : 'Coach AI'}</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
