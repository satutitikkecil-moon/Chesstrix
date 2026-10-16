import React, { useState, useEffect } from 'react';
import { fetchChessComProfile, fetchRecentGames, ChessComProfile } from '../utils/chessComApi.ts';
import { GameMetadata, SAMPLE_GAMES, analyzePgnGame, AnalyzedGame } from '../utils/sampleGames.ts';
import { Search, Globe, User, Swords, Zap, CheckCircle2, AlertTriangle, FileText, Play, BookmarkPlus, Star } from 'lucide-react';
import { getSavedPlayers, savePlayer, getActivePlayerUsername, setActivePlayerUsername, SavedPlayer } from '../utils/playerStorage.ts';

interface ChessComSyncProps {
  onAnalyzeGame: (analyzed: AnalyzedGame) => void;
}

export const ChessComSync: React.FC<ChessComSyncProps> = ({ onAnalyzeGame }) => {
  const [username, setUsername] = useState<string>(() => getActivePlayerUsername());
  const [profile, setProfile] = useState<ChessComProfile | null>(null);
  const [recentGames, setRecentGames] = useState<GameMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [savedList, setSavedList] = useState<SavedPlayer[]>(() => getSavedPlayers());

  // Custom PGN paste state
  const [customPgn, setCustomPgn] = useState<string>('');
  const [showPgnModal, setShowPgnModal] = useState<boolean>(false);

  const popularUsers = ['Hikaru', 'MagnusCarlsen', 'GothamChess', 'DanielNaroditsky'];

  // Initial fetch on mount
  useEffect(() => {
    handleFetchProfile(getActivePlayerUsername());
  }, []);

  const handleFetchProfile = async (targetUser?: string) => {
    const userToFetch = targetUser || username;
    if (!userToFetch.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const prof = await fetchChessComProfile(userToFetch);
      if (prof) {
        setProfile(prof);
        setUsername(prof.username);
        const games = await fetchRecentGames(userToFetch);
        setRecentGames(games);
      } else {
        setErrorMsg(`Pengguna "${userToFetch}" tidak ditemukan atau Chess.com API sedang sibuk.`);
      }
    } catch {
      setErrorMsg('Gagal terhubung ke Chess.com API.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentPlayer = () => {
    if (!profile) return;
    savePlayer({
      username: profile.username,
      name: profile.name || profile.username,
      avatar: profile.avatar,
      isMainAccount: true,
      lastBlitzRating: profile.stats?.blitz?.last,
      lastRapidRating: profile.stats?.rapid?.last
    });
    setSavedList(getSavedPlayers());
    setActivePlayerUsername(profile.username);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAnalyzePreset = (gameMeta: GameMetadata) => {
    const analyzed = analyzePgnGame(gameMeta);
    onAnalyzeGame(analyzed);
  };

  const handleAnalyzeCustomPgn = () => {
    if (!customPgn.trim()) return;

    try {
      const customMeta: GameMetadata = {
        id: `custom_${Date.now()}`,
        title: 'Game Kustom Chess.com',
        event: 'Custom PGN Import',
        date: new Date().toISOString().split('T')[0],
        white: { username: 'Putih', rating: 1500 },
        black: { username: 'Hitam', rating: 1500 },
        result: '1-0',
        timeControl: 'Standard',
        openingName: 'Custom Game',
        eco: 'A00',
        pgn: customPgn.trim()
      };

      const analyzed = analyzePgnGame(customMeta);
      setShowPgnModal(false);
      onAnalyzeGame(analyzed);
    } catch (e) {
      setErrorMsg('Format PGN tidak valid. Pastikan format PGN catur lengkap.');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3 overflow-y-auto">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">
            Sinkronisasi & Analisis Chess.com
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Masukkan username Chess.com untuk mengimpor arsip pertandingan terbaru, rating pemain, atau tempel PGN untuk audit taktis pasca-pertandingan.
        </p>

        {/* Search input */}
        <div className="flex items-center gap-2 mt-3">
          <div className="relative flex-1">
            <label htmlFor="chesscom-user" className="sr-only">Username Chess.com</label>
            <input
              id="chesscom-user"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username Chess.com..."
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => handleFetchProfile()}
            disabled={loading}
            className="min-h-[44px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-transform active:scale-95 cursor-pointer shadow-md"
          >
            {loading ? 'Memuat...' : 'Cari'}
          </button>
        </div>

        {/* Saved Player ID Chips */}
        {savedList.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1">
            <span className="text-[10px] text-emerald-400 font-bold shrink-0">Tersimpan:</span>
            {savedList.map((p) => {
              const isCurrent = username.toLowerCase() === p.username.toLowerCase();
              return (
                <button
                  key={p.username}
                  type="button"
                  onClick={() => {
                    setUsername(p.username);
                    handleFetchProfile(p.username);
                  }}
                  className={`min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 cursor-pointer flex items-center gap-1 border ${
                    isCurrent
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <Star className={`w-3 h-3 ${p.isMainAccount ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
                  <span>{p.username}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick User Chips */}
        <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-1">
          <span className="text-[10px] text-slate-500 shrink-0">Populer:</span>
          {popularUsers.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => {
                setUsername(u);
                handleFetchProfile(u);
              }}
              className="min-h-[36px] px-2 py-0.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-[10px] text-slate-400 hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="bg-rose-950/30 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Card (If fetched) */}
      {profile && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.username}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                  <User className="w-6 h-6" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5">
                  {profile.title && (
                    <span className="bg-rose-500 text-white font-mono text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                      {profile.title}
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-white">
                    {profile.username}
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {profile.name || 'Pemain Chess.com'}
                </span>
              </div>
            </div>

            {/* Simpan ID Pemain Button */}
            <button
              type="button"
              onClick={handleSaveCurrentPlayer}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>{savedSuccess ? 'Tersimpan!' : 'Simpan ID'}</span>
            </button>
          </div>

          {/* Ratings Grid */}
          {profile.stats && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/60 text-center">
                <span className="text-[10px] text-slate-400 block">⚡ Blitz</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {profile.stats.blitz?.last || '—'}
                </span>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/60 text-center">
                <span className="text-[10px] text-slate-400 block">⏱ Rapid</span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {profile.stats.rapid?.last || '—'}
                </span>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/60 text-center">
                <span className="text-[10px] text-slate-400 block">🎯 Bullet</span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {profile.stats.bullet?.last || '—'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paste PGN & Import Custom Game Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowPgnModal(true)}
          className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Tempel PGN Chess.com</span>
        </button>
      </div>

      {/* Recent Games from API */}
      {recentGames.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 block px-1">
            Pertandingan Terbaru dari Chess.com ({recentGames.length})
          </span>

          {recentGames.map((game) => (
            <div
              key={game.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <span className="text-xs font-bold text-slate-100 block">
                  {game.title}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span>{game.event}</span>
                  <span>·</span>
                  <span className="font-mono text-emerald-400">{game.result}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAnalyzePreset(game)}
                className="min-h-[44px] px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-transform active:scale-95 flex items-center gap-1 cursor-pointer shrink-0 ml-2"
              >
                <span>Analisis</span>
                <Play className="w-3 h-3 fill-slate-950" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Featured / Sample Master Games (Always available offline & instant) */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 block px-1">
          Game Pilihan & Latihan Blunder (Instan):
        </span>

        {SAMPLE_GAMES.map((game) => (
          <div
            key={game.id}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-bold text-slate-100">
                  {game.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-mono text-emerald-400">{game.eco}</span>
                <span>·</span>
                <span>{game.openingName}</span>
                <span>·</span>
                <span className="font-mono">{game.result}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAnalyzePreset(game)}
              className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0 ml-2 shadow-md"
            >
              <span>Analisis</span>
              <Play className="w-3 h-3 fill-slate-950" />
            </button>
          </div>
        ))}
      </div>

      {/* PGN Paste Modal */}
      {showPgnModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 w-full max-w-sm shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-white">
              Tempel PGN Pertandingan
            </h3>
            <p className="text-xs text-slate-400">
              Salin notasi PGN dari Chess.com lalu tempel di sini untuk analisis langkah demi langkah.
            </p>

            <textarea
              rows={6}
              value={customPgn}
              onChange={(e) => setCustomPgn(e.target.value)}
              placeholder="1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPgnModal(false)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAnalyzeCustomPgn}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-transform active:scale-95 cursor-pointer shadow-md"
              >
                Mulai Analisis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
