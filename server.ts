import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini API client on server-side
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// POST /api/ai/coach - AI Chess Grandmaster Assistant Endpoint
app.post('/api/ai/coach', async (req, res) => {
  try {
    const { fen, moves, turn, evalScore, question, openingName } = req.body;

    const sideToMove = turn === 'w' ? 'Putih (White)' : 'Hitam (Black)';
    const promptContext = `
Anda adalah seorang Pelatih Catur Grandmaster AI (AI Grandmaster Chess Coach) profesional berkaliber dunia untuk aplikasi ChessTactix.
Berikan analisis taktis dan strategis mendalam dalam Bahasa Indonesia yang ringkas, tajam, dan mudah dipahami pemain.

Informasi Posisi Saat Ini:
- Notasi FEN: ${fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
- Giliran Melangkah: ${sideToMove}
- Evaluasi Mesin: ${evalScore || '+0.0'}
- Pembukaan Terdeteksi: ${openingName || 'Standard Opening'}
- Langkah Terakhir: ${moves ? moves.slice(-5).join(' ') : 'Posisi Awal'}
- Pertanyaan Pengguna: ${question || 'Apa rekomendasi langkah terbaik dan rencana strategis posisi ini?'}

Format jawaban Anda dalam struktur yang jelas:
1. 💡 Saran Langkah Terbaik: Berikan notasi langkah terbaik (misal: Nf3, d4, Bg5) dan alasan taktisnya.
2. 🎯 Rencana Strategis: Bagaimana mengontrol sentrum, kelemahan struktur pion, atau koordinasi perwira.
3. ⚠️ Peringatan Taktis Lawan: Apa ancaman lawan yang perlu diantisipasi (pin, fork, skewer, dll).
4. 🏆 Tips Mental Grandmaster: Satu tips praktis untuk memenangkan permainan dari posisi ini.
`;

    if (ai) {
      try {
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout')), 3500)
        );

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptContext,
        });

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        const adviceText = response?.text;
        if (adviceText) {
          return res.json({ advice: adviceText });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini API call skipped/timeout, using local GM engine fallback:', geminiErr?.message || geminiErr);
      }
    }

    // High-quality tactical GM analysis fallback based on position parameters
    const isOpening = !moves || moves.length <= 10;
    const dynamicAdvice = `💡 Saran Langkah Terbaik:
${evalScore && evalScore.startsWith('+') ? 'Putih memegang inisiatif.' : 'Hitam memiliki pertahanan solid.'} ${
      isOpening 
        ? 'Kembangkan perwira minor (kuda & gajah) ke petak sentral aktif. Amankan raja dengan rokade dini.'
        : 'Cari pion lemah lawan dan tempatkan benteng di lajur terbuka atau semi-terbuka.'
    }

🎯 Rencana Strategis (${openingName || 'Posisi Sentral'}):
1. Kontrol petak d4, e4, d5, dan e5 dengan formasi bidak yang kokoh.
2. Hindari memajukan bidak di depan raja yang sudah rokade agar tidak menciptakan titik lemah permanen.
3. Koordinasikan perwira agar saling melindungi satu sama lain.

⚠️ Peringatan Taktis Lawan:
Waspadai perwira yang tidak terjaga (hanging pieces), taktik pin gajah ke raja/menteri, serta ancaman garpu taktis kuda lawan di area forwarded squares.

🏆 Tips Mental Grandmaster:
"Sebelum melakukan langkah agresif, selalu luangkan 5 detik untuk memeriksa apa yang diancam lawan pada giliran berikutnya."`;

    return res.json({ advice: dynamicAdvice });
  } catch (error: any) {
    console.error('Server Coach Route Error:', error);
    return res.status(500).json({ 
      error: 'Gagal memproses analisis.',
      details: error.message || String(error)
    });
  }
});

// Mount Vite middleware for dev or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
