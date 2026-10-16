import React, { useState } from 'react';
import { Terminal, Copy, Check, Download, X, Code2, Smartphone, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall.ts';

interface FlutterExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlutterExportModal: React.FC<FlutterExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'pubspec' | 'instructions'>('main');
  const { setManualInstalled } = usePWAInstall();

  if (!isOpen) return null;

  const flutterMainDart = `// Flutter Native Entrypoint: lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_chess_board/flutter_chess_board.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ChessTactixApp());
}

class ChessTactixApp extends StatelessWidget {
  const ChessTactixApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ChessTactix',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF020617),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981),
          surface: Color(0xFF0F172A),
        ),
      ),
      home: const ChessTactixHomePage(),
    );
  }
}

class ChessTactixHomePage extends StatefulWidget {
  const ChessTactixHomePage({super.key});

  @override
  State<ChessTactixHomePage> createState() => _ChessTactixHomePageState();
}

class _ChessTactixHomePageState extends State<ChessTactixHomePage> {
  final ChessBoardController _controller = ChessBoardController();
  String _evalScore = "+0.1";
  String _aiAdvice = "Selamat datang di ChessTactix! Mainkan langkah Anda di papan.";
  bool _isLoadingAi = false;

  Future<void> _askAiCoach() async {
    setState(() => _isLoadingAi = true);
    try {
      final res = await http.post(
        Uri.parse('https://your-api-url.run.app/api/ai/coach'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'fen': _controller.getFen(),
          'turn': _controller.game.turn.name,
        }),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() => _aiAdvice = data['advice'] ?? '');
      }
    } catch (e) {
      setState(() => _aiAdvice = 'Gagal menghubungi server AI: \$e');
    } finally {
      setState(() => _isLoadingAi = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ChessTactix AI Coach', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF0F172A),
        actions: [
          IconButton(
            icon: const Icon(Icons.psychology, color: Color(0xFF10B981)),
            onPressed: _askAiCoach,
            tooltip: 'Tanya Coach AI',
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Interactive Flutter Chessboard
              ChessBoard(
                controller: _controller,
                boardColor: BoardColor.brown,
                boardOrientation: PlayerColor.white,
                onMove: () {
                  setState(() {});
                },
              ),
              const SizedBox(height: 16),
              // AI Coach Advice Card
              Card(
                color: const Color(0xFF0F172A),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Analisis AI Grandmaster', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                          if (_isLoadingAi) const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(_aiAdvice, style: const TextStyle(fontSize: 13, height: 1.4)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`;

  const pubspecYaml = `name: chesstactix
description: Chess.com Analyzer and AI Real-Time Tactical Coach
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_chess_board: ^1.0.5
  http: ^1.2.0
  shared_preferences: ^2.2.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`;

  const handleCopy = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Paket Source Code Flutter Native
              </h2>
              <span className="text-[11px] text-slate-400 block">
                Kode Flutter & Perintah Build APK Android
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

        {/* Tabs */}
        <div className="flex items-center px-4 pt-3 gap-2 bg-slate-950/40 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('main')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'main' ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            lib/main.dart
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pubspec')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'pubspec' ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            pubspec.yaml
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instructions')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'instructions' ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Instruksi Build APK
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 font-mono text-xs">
          {activeTab === 'main' && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400 font-sans">Source code Flutter Material 3 dengan controller papan catur:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopy(flutterMainDart, 'main')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans transition-colors cursor-pointer"
                  >
                    {copiedTab === 'main' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTab === 'main' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile('main.dart', flutterMainDart)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] font-sans transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </button>
                </div>
              </div>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto max-h-80 whitespace-pre">
                {flutterMainDart}
              </pre>
            </div>
          )}

          {activeTab === 'pubspec' && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400 font-sans">Dependensi Flutter:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopy(pubspecYaml, 'pubspec')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans transition-colors cursor-pointer"
                  >
                    {copiedTab === 'pubspec' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile('pubspec.yaml', pubspecYaml)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] font-sans transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </button>
                </div>
              </div>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto max-h-80 whitespace-pre">
                {pubspecYaml}
              </pre>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="font-sans space-y-3 text-slate-300 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block text-sm">Cara Build APK Flutter di Komputer:</span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[12px] leading-relaxed">
                  <li>Buat project Flutter baru: <code className="text-emerald-400 font-mono">flutter create chesstactix</code></li>
                  <li>Ganti <code className="text-emerald-400 font-mono">pubspec.yaml</code> dan <code className="text-emerald-400 font-mono">lib/main.dart</code> dengan kode dari tab di atas.</li>
                  <li>Jalankan unduh dependensi: <code className="text-emerald-400 font-mono">flutter pub get</code></li>
                  <li>Build berkas APK siap rilis: <code className="text-emerald-400 font-mono">flutter build apk --release</code></li>
                  <li>File APK akan tersedia di: <br/><code className="text-cyan-400 font-mono text-[11px]">build/app/outputs/flutter-apk/app-release.apk</code></li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setManualInstalled(true);
              onClose();
            }}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Tandai aplikasi sudah diinstal untuk menyembunyikan tombol header"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Tandai Terpasang (Sembunyikan Tombol Header)</span>
          </button>

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
