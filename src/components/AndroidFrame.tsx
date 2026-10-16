import React, { useState } from 'react';
import { 
  Bot, 
  Volume2, 
  VolumeX, 
  Download, 
  Code2, 
  User, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { AndroidInstallerModal } from './AndroidInstallerModal.tsx';
import { FlutterExportModal } from './FlutterExportModal.tsx';
import { getActivePlayerUsername } from '../utils/playerStorage.ts';

interface AndroidFrameProps {
  children: React.ReactNode;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenCoachAi: () => void;
  onOpenPlayerManager: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  soundEnabled,
  onToggleSound,
  onOpenCoachAi,
  onOpenPlayerManager
}) => {
  const [showInstaller, setShowInstaller] = useState<boolean>(false);
  const [showFlutterCode, setShowFlutterCode] = useState<boolean>(false);

  const activeUsername = getActivePlayerUsername();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start overflow-x-hidden">
      {/* Flutter / Material 3 Native AppBar */}
      <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & Active Player ID Chip */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm shadow-sm">
              ♟
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                  ChessTactix
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  v1.2
                </span>
              </div>
              {/* Clickable Active Player ID */}
              <button
                type="button"
                onClick={onOpenPlayerManager}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
                title="Kelola & Simpan ID Pemain"
              >
                <User className="w-3 h-3 text-emerald-400" />
                <span className="font-mono font-medium truncate max-w-28 sm:max-w-none">
                  {activeUsername}
                </span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Ask AI Coach FAB / Action */}
            <button
              type="button"
              onClick={onOpenCoachAi}
              className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
              title="Tanya Saran Coach AI Grandmaster"
            >
              <Bot className="w-4 h-4 text-slate-950" />
              <span className="hidden xs:inline">Coach AI</span>
            </button>

            {/* Flutter Source Code Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowFlutterCode(true)}
              className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Lihat Source Code Flutter Native"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Flutter Native</span>
            </button>

            {/* Install APK Trigger */}
            <button
              type="button"
              onClick={() => setShowInstaller(true)}
              className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Pasang / Download APK"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Pasang APK</span>
            </button>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
              className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area (Edge-to-Edge without status bar clutter) */}
      <div className="w-full max-w-4xl flex-1 flex flex-col mx-auto relative overflow-hidden">
        {children}
      </div>

      {/* Android APK Installer Dialog */}
      <AndroidInstallerModal
        isOpen={showInstaller}
        onClose={() => setShowInstaller(false)}
      />

      {/* Flutter Native Code Export Dialog */}
      <FlutterExportModal
        isOpen={showFlutterCode}
        onClose={() => setShowFlutterCode(false)}
      />
    </div>
  );
};
