import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, Battery, Volume2, VolumeX, Sparkles, Download } from 'lucide-react';
import { AndroidInstallerModal } from './AndroidInstallerModal.tsx';

interface AndroidFrameProps {
  children: React.ReactNode;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  soundEnabled,
  onToggleSound
}) => {
  const [deviceFrame, setDeviceFrame] = useState<boolean>(true);
  const [showInstaller, setShowInstaller] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start sm:p-4 md:p-6 overflow-x-hidden">
      {/* Top Utility Bar (for switching Android Frame preview vs Full Screen) */}
      <header className="w-full max-w-6xl flex items-center justify-between py-2 px-3 mb-2 border-b border-slate-800/60 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
            ♟
          </div>
          <span className="font-semibold text-slate-200">ChessTactix</span>
          <span className="hidden sm:inline text-slate-500">·</span>
          <span className="hidden sm:inline text-slate-400">Android Chess.com Analyzer</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Install APK Button */}
          <button
            type="button"
            onClick={() => setShowInstaller(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-transform active:scale-95 cursor-pointer shadow-sm"
            title="Pasang / Download APK Android"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px]">Pasang APK</span>
          </button>

          {/* Audio toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
            title={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] hidden sm:inline">Suara On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] hidden sm:inline">Mute</span>
              </>
            )}
          </button>

          {/* Device Frame Toggle */}
          <button
            type="button"
            onClick={() => setDeviceFrame(!deviceFrame)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
            title="Ganti Tampilan Android / Fullscreen"
          >
            {deviceFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] hidden sm:inline">Layar Penuh</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] hidden sm:inline">Frame Android</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container: Device frame or edge-to-edge */}
      <div
        className={`w-full transition-all duration-300 ${
          deviceFrame
            ? 'max-w-[430px] rounded-[44px] border-[10px] border-slate-800 bg-slate-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative my-auto min-h-[850px] max-h-[92vh]'
            : 'max-w-6xl rounded-2xl border border-slate-800 bg-slate-950 flex flex-col flex-1'
        }`}
      >
        {/* Android Status Bar (Camera notch + time + status icons) */}
        <div className="shrink-0 h-10 px-6 flex items-center justify-between text-xs text-slate-300 select-none bg-slate-950/90 z-30">
          <span className="font-semibold tracking-tight text-[13px]">{currentTime}</span>

          {/* Front camera pinhole (Pixel style) */}
          {deviceFrame && (
            <div className="w-4 h-4 rounded-full bg-black border border-slate-800 mx-auto" />
          )}

          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[10px] font-bold tracking-tight bg-slate-800/80 px-1 rounded text-emerald-400">5G</span>
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Dynamic App Content */}
        <div className="flex-1 overflow-y-auto flex flex-col relative">
          {children}
        </div>

        {/* Android Gesture Navigation Pill at Bottom */}
        {deviceFrame && (
          <div className="shrink-0 h-5 bg-slate-950 flex items-center justify-center select-none pb-1">
            <div className="w-32 h-1 bg-slate-600 rounded-full" />
          </div>
        )}
      </div>

      {/* Android APK Installer Modal */}
      <AndroidInstallerModal
        isOpen={showInstaller}
        onClose={() => setShowInstaller(false)}
      />
    </div>
  );
};
