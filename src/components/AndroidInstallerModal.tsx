import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall.ts';
import { 
  Download, 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  Terminal, 
  Copy, 
  Check, 
  Sparkles,
  Layers,
  ArrowDownCircle
} from 'lucide-react';

interface AndroidInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallerModal: React.FC<AndroidInstallerModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install, setManualInstalled } = usePWAInstall();
  const [copied, setCopied] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'webapk' | 'standalone_apk'>('webapk');

  if (!isOpen) return null;

  const bubblewrapCommand = `npm install -g @bubblewrap/cli
bubblewrap init --manifest="${window.location.origin}/manifest.webmanifest"
bubblewrap build`;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(bubblewrapCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadManifest = () => {
    const manifestData = {
      packageId: "com.chesstactix.analyzer",
      host: window.location.host,
      name: "ChessTactix - Chess.com Analyzer",
      launcherName: "ChessTactix",
      themeColor: "#020617",
      navigationColor: "#020617",
      backgroundColor: "#020617",
      startUrl: "/",
      iconUrl: `${window.location.origin}/pwa-512x512.png`,
      maskableIconUrl: `${window.location.origin}/pwa-maskable-512x512.png`,
      minSdkVersion: 21,
      targetSdkVersion: 34,
      versionCode: 1,
      versionName: "1.0.0"
    };

    const blob = new Blob([JSON.stringify(manifestData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'android-twa-manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Installer & Paket APK Android
              </h2>
              <span className="text-[11px] text-slate-400 block">
                Versi 1.0.0 · Siap Pasang di Ponsel
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* Status Banner */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-emerald-300 block">
                {isInstalled ? 'Aplikasi Sudah Terpasang' : 'Paket Android Siap Diinstal'}
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                {isInstalled
                  ? 'Aplikasi berjalan dalam mode standalone Android tanpa bilah alamat browser.'
                  : 'Dapat langsung dipasang ke perangkat Android Anda sebagai WebAPK resmi atau diekspor menjadi berkas APK mandiri.'}
              </p>
            </div>
          </div>

          {/* Sub-Tabs: WebAPK vs Standalone APK */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveSubTab('webapk')}
              className={`flex-1 min-h-[38px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'webapk'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pasang Cepat (WebAPK)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('standalone_apk')}
              className={`flex-1 min-h-[38px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'standalone_apk'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Build Berkas APK (TWA)
            </button>
          </div>

          {/* Tab 1: WebAPK Direct Install */}
          {activeSubTab === 'webapk' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white block">
                  Metode 1: Pemasangan Otomatis di Android
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Android secara otomatis membuat paket APK native (*WebAPK*) saat Anda menekan tombol instal. Ikon akan muncul di laci aplikasi (*App Drawer*) dan layar utama Anda.
                </p>

                {/* Primary Install Trigger */}
                <button
                  type="button"
                  onClick={async () => {
                    if (isInstallable) {
                      await install();
                    }
                    setManualInstalled(true);
                    onClose();
                  }}
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer shadow-lg mt-2"
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>{isInstalled ? 'Aplikasi Sudah Terpasang' : 'Pasang Aplikasi Sekarang'}</span>
                </button>

                {/* Manual toggle state button */}
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Status tombol header:</span>
                  <button
                    type="button"
                    onClick={() => setManualInstalled(!isInstalled)}
                    className="text-emerald-400 hover:underline cursor-pointer font-medium"
                  >
                    {isInstalled ? 'Tampilkan Kembali Tombol' : 'Tandai Sudah Terpasang (Sembunyikan Tombol)'}
                  </button>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                <span className="font-semibold text-slate-300 block">Langkah Manual di Android Chrome:</span>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                  <li>Buka tautan ini di browser Chrome Android.</li>
                  <li>Ketuk menu <span className="text-slate-200 font-bold">Titik Tiga (⋮)</span> di pojok kanan atas.</li>
                  <li>Pilih menu <span className="text-emerald-400 font-bold">"Pasang aplikasi"</span> (atau <em>"Add to Home Screen"</em>).</li>
                  <li>Konfirmasi <span className="text-slate-200 font-bold">"Instal"</span>. Paket APK akan langsung terpasang di sistem Android Anda.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Tab 2: Standalone APK Build Package */}
          {activeSubTab === 'standalone_apk' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white block">
                  Metode 2: Export Berkas APK Mandiri (CLI)
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Gunakan Google Bubblewrap CLI (perangkat resmi Google untuk membuat file APK / AAB dari Web App):
                </p>

                {/* Terminal Snippet */}
                <div className="relative bg-slate-900 rounded-xl p-2.5 border border-slate-800 font-mono text-[11px] text-emerald-300">
                  <pre className="overflow-x-auto whitespace-pre-wrap">{bubblewrapCommand}</pre>
                  <button
                    type="button"
                    onClick={handleCopyCommand}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="Salin Perintah"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadManifest}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Unduh android-twa-manifest.json</span>
                </button>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300 block mb-1">Karakteristik Paket APK:</span>
                • Target Android: Android 5.0 (API 21) hingga Android 14+ (API 34).<br />
                • Fitur: Mode Layar Penuh Standalone, Dukungan Offline Cache, Ikon Adaptif Android.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
