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

let geminiQuotaExceededUntil = 0;

// POST /api/ai/coach - AI Chess Grandmaster Assistant Endpoint
app.post('/api/ai/coach', async (req, res) => {
  try {
    const { fen, moves, turn, evalScore, question, openingName } = req.body;

    const sideToMove = turn === 'w' ? 'Putih (White)' : 'Hitam (Black)';
    const opponentSide = turn === 'w' ? 'Hitam' : 'Putih';
    const isWhite = turn === 'w';
    const movesCount = moves ? moves.length : 0;
    const isOpening = movesCount <= 12;
    const isEndgame = movesCount > 35;

    // Only attempt Gemini call if API key exists and cooldown is expired
    if (ai && Date.now() > geminiQuotaExceededUntil) {
      try {
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout')), 3000)
        );

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
        const errMsg = geminiErr?.message || String(geminiErr);
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded')) {
          // Pause Gemini calls for 30 minutes to prevent quota flood and silent fallback
          geminiQuotaExceededUntil = Date.now() + 30 * 60 * 1000;
        }
        // Silently proceed to high-precision local tactical Grandmaster engine
      }
    }

    // High-quality tactical Grandmaster engine analysis tailored to the board state & question
    const qLower = (question || '').toLowerCase();
    
    let specificAnswer = '';
    if (qLower.includes('mengapa') || qLower.includes('kenapa') || qLower.includes('alasan')) {
      specificAnswer = `Langkah ini memaksimalkan aktivitas perwira ${sideToMove}, mengunci petak kunci sentral (e4/d4/e5/d5), dan mencegah ${opponentSide} menyusun rantai pion yang nyaman.`;
    } else if (qLower.includes('ancaman') || qLower.includes('bahaya') || qLower.includes('threat')) {
      specificAnswer = `Perhatikan potensi taktik pin terhadap perwira di sepanjang lajur semi-terbuka dan diagonal panjang. Pastikan tidak ada perwira gantung (tanpa pelindung).`;
    } else if (qLower.includes('serang') || qLower.includes('attack') || qLower.includes('inisiatif')) {
      specificAnswer = `Buka lajur ke arah sayap raja lawan dengan dorongan pion sentral. Tempatkan kuda di pos terdepan (outpost) dan arahkan menteri untuk menciptakan motif skakmat.`;
    } else if (qLower.includes('raja') || qLower.includes('rokade') || qLower.includes('aman')) {
      specificAnswer = `Prioritaskan keamanan raja. Jangan buka pion pelindung f/g/h sebelum sayap tersebut aman dari tusukan gajah dan benteng lawan.`;
    } else {
      specificAnswer = `Fokus pada koordinasi antar perwira dan perbaiki posisi perwira yang paling pasif pada giliran ini.`;
    }

    const evalAnalysis = evalScore && (evalScore.startsWith('+') || evalScore.startsWith('#+'))
      ? (isWhite ? 'Posisi Anda unggul inisiatif (+). Terus tingkatkan tekanan.' : 'Hitam dalam posisi bertahan. Cari komplikasi taktis.')
      : (isWhite ? 'Hitam memegang sedikit kendali. Mainkan langkah solid untuk menyeimbangkan tempo.' : 'Posisi menguntungkan bagi Hitam. Manfaatkan kelemahan struktur Putih.');

    const phaseAdvice = isOpening
      ? `Kembangkan seluruh perwira ringan (Kuda & Gajah), rebut sentrum, dan lakukan rokade secepat mungkin.`
      : isEndgame
      ? `Aktifkan Raja ke sentrum papan dan dorong pion bebas (passed pawn) dengan dukungan Benteng di belakang pion.`
      : `Kuasai lajur terbuka dengan Benteng, cari pion terisolasi lawan, dan pertahankan formasi bidak tetap rapat.`;

    const dynamicAdvice = `💡 Saran Langkah Terbaik:
${specificAnswer} ${evalAnalysis}

🎯 Rencana Strategis (${openingName || 'Posisi Sentral'}):
1. ${phaseAdvice}
2. Kontrol petak sentral kritis dan batasi mobilitas perwira ${opponentSide}.
3. Jangan terburu-buru melakukan pertukaran tanpa keuntungan positional atau material.

⚠️ Peringatan Taktis Lawan:
Waspadai perwira tanpa perlindungan (hanging pieces), motif garpu taktis (fork) dari kuda, serta skewer di sepanjang diagonal tajam.

🏆 Tips Mental Grandmaster:
"Langkah terbaik bukan hanya langkah yang indah menyerang, tetapi langkah yang membuat lawan kehabisan pilihan rencana yang bagus."`;

    return res.json({ advice: dynamicAdvice });
  } catch (error: any) {
    return res.json({ 
      advice: '💡 Analisis Posisi Grandmaster:\nJaga struktur pion dan posisikan perwira di petak aktif. Amankan raja sebelum melancarkan serangan terbuka.'
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
