import React, { useState } from 'react';
import { 
  User, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Star, 
  X, 
  Globe, 
  RefreshCw,
  Search
} from 'lucide-react';
import { 
  getSavedPlayers, 
  savePlayer, 
  deleteSavedPlayer, 
  setActivePlayerUsername, 
  getActivePlayerUsername, 
  SavedPlayer 
} from '../utils/playerStorage.ts';
import { fetchChessComProfile } from '../utils/chessComApi.ts';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerSelected: (username: string) => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  onPlayerSelected
}) => {
  const [players, setPlayers] = useState<SavedPlayer[]>(() => getSavedPlayers());
  const [activeUsername, setActiveUsername] = useState<string>(() => getActivePlayerUsername());
  const [newUsername, setNewUsername] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPlayer = (username: string) => {
    setActivePlayerUsername(username);
    setActiveUsername(username);
    onPlayerSelected(username);
    onClose();
  };

  const handleAddPlayer = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed) return;

    setIsAdding(true);
    setErrorMsg(null);

    try {
      // Validate with Chess.com API
      const profile = await fetchChessComProfile(trimmed);
      const isFirst = players.length === 0;

      const saved = savePlayer({
        username: profile?.username || trimmed,
        name: profile?.name || trimmed,
        avatar: profile?.avatar,
        isMainAccount: isFirst,
        lastBlitzRating: profile?.stats?.blitz?.last,
        lastRapidRating: profile?.stats?.rapid?.last
      });

      setPlayers(getSavedPlayers());
      setNewUsername('');
      setActivePlayerUsername(saved.username);
      setActiveUsername(saved.username);
      onPlayerSelected(saved.username);
    } catch {
      setErrorMsg('Gagal memvalidasi username Chess.com.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSavedPlayer(username);
    const updated = getSavedPlayers();
    setPlayers(updated);
    if (activeUsername.toLowerCase() === username.toLowerCase() && updated.length > 0) {
      setActivePlayerUsername(updated[0].username);
      setActiveUsername(updated[0].username);
      onPlayerSelected(updated[0].username);
    }
  };

  const handleSetMain = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = players.map(p => ({
      ...p,
      isMainAccount: p.username.toLowerCase() === username.toLowerCase()
    }));
    try {
      localStorage.setItem('chesstactix_saved_players', JSON.stringify(updated));
      setPlayers(updated);
      setActivePlayerUsername(username);
      setActiveUsername(username);
      onPlayerSelected(username);
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Kelola & Simpan ID Pemain
              </h2>
              <span className="text-[11px] text-slate-400 block">
                Simpan akun Chess.com untuk audit otomatis
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input to add new ID */}
        <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 space-y-2">
          <span className="text-[11px] font-semibold text-slate-300 block">
            Tambah Username Chess.com Baru:
          </span>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddPlayer();
                }}
                placeholder="cth: magnuscarlsen, gothamchess..."
                disabled={isAdding}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddPlayer}
              disabled={isAdding || !newUsername.trim()}
              className="min-h-[40px] px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-md"
            >
              {isAdding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Simpan</span>
            </button>
          </div>
          {errorMsg && (
            <span className="text-[11px] text-rose-400 block">{errorMsg}</span>
          )}
        </div>

        {/* Saved Player List */}
        <div className="p-3.5 overflow-y-auto space-y-2 flex-1">
          <span className="text-[11px] font-semibold text-slate-400 block">
            ID Pemain Tersimpan ({players.length}):
          </span>

          {players.map((p) => {
            const isActive = activeUsername.toLowerCase() === p.username.toLowerCase();

            return (
              <div
                key={p.username}
                onClick={() => handleSelectPlayer(p.username)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isActive
                    ? 'bg-slate-800/90 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt={p.username}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">
                        {p.username}
                      </span>
                      {p.isMainAccount && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded">
                          Utama
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Blitz: {p.lastBlitzRating || '—'} · Rapid: {p.lastRapidRating || '—'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handleSetMain(p.username, e)}
                    className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                    title={p.isMainAccount ? 'Akun Utama' : 'Jadikan Akun Utama'}
                  >
                    <Star className={`w-3.5 h-3.5 ${p.isMainAccount ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(p.username, e)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Hapus ID Pemain"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
