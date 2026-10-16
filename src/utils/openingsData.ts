export interface OpeningStat {
  eco: string;
  name: string;
  moves: string; // e.g. "e4 c5"
  movesArray: string[];
  whiteWin: number;
  draw: number;
  blackWin: number;
  totalGames: number;
  popularity: number; // 1-100
  strategyOverview: string;
  keyTactics: string[];
  pawnStructure: string;
}

export const OPENINGS_DATABASE: OpeningStat[] = [
  {
    eco: "B90",
    name: "Sicilian Defense: Najdorf Variation",
    moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6",
    movesArray: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
    whiteWin: 38,
    draw: 34,
    blackWin: 28,
    totalGames: 421000,
    popularity: 98,
    strategyOverview: "Hitam berusaha mengontrol petak e5 dan sayap menteri dengan fleksibilitas tinggi. Putih menyerang cepat di sayap raja (Bg5 atau Be3 f3).",
    keyTactics: ["Tusukan sayap menteri b5-b4", "Pengorbanan kualitas ...Rxc3", "Garpu kuda di d4/c5"],
    pawnStructure: "Asimetris (d6/e6 vs e4), Hitam memiliki mayoritas bidak sentral 2 vs 1."
  },
  {
    eco: "C50",
    name: "Italian Game: Giuoco Piano",
    moves: "e4 e5 Nf3 Nc6 Bc4 Bc5",
    movesArray: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
    whiteWin: 39,
    draw: 33,
    blackWin: 28,
    totalGames: 380000,
    popularity: 92,
    strategyOverview: "Pertarungan klasik mengincar petak f7 yang rentan. Putih sering membangun pusat kuat dengan c3 dan d4.",
    keyTactics: ["Taktik f7 sacrifice (Fried Liver / Greco)", "Pin Bg5 terhadap kuda f6", "Manuver Kuda Nbd2-f1-g3"],
    pawnStructure: "Simetris e4/e5, fleksibel untuk transisi d3 atau d4."
  },
  {
    eco: "C65",
    name: "Ruy Lopez: Berlin Defense",
    moves: "e4 e5 Nf3 Nc6 Bb5 Nf6",
    movesArray: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"],
    whiteWin: 37,
    draw: 42,
    blackWin: 21,
    totalGames: 295000,
    popularity: 88,
    strategyOverview: "Pertahanan kokoh legendaris yang memicu Berlin Endgame. Menguji penguasaan endgame dan keunggulan sepasang gajah Hitam.",
    keyTactics: ["Pin Bb5 pada Kuda c6", "Pendorongan d4 vs d6", "Endgame raja aktif di e8"],
    pawnStructure: "Bidak ganda c7/c6 untuk Hitam namun memiliki kompensasi sepasang gajah."
  },
  {
    eco: "D35",
    name: "Queen's Gambit Declined: Exchange Variation",
    moves: "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5",
    movesArray: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5"],
    whiteWin: 41,
    draw: 38,
    blackWin: 21,
    totalGames: 260000,
    popularity: 85,
    strategyOverview: "Putih menjalankan serangan minoritas (Minority Attack) di sayap menteri (b4-b5), menargetkan bidak c6 yang lemah.",
    keyTactics: ["Minority Attack b4-b5", "Tekanan pada lajur-c terbuka", "Pencegahan outpost Ne4"],
    pawnStructure: "Struktur Carlsbad (Putih bidak e3/f2/g2/h2 dan a2/b2; Hitam a7/b7/c6 dan f7/g7/h7)."
  },
  {
    eco: "E60",
    name: "King's Indian Defense",
    moves: "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6",
    movesArray: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6"],
    whiteWin: 42,
    draw: 29,
    blackWin: 29,
    totalGames: 310000,
    popularity: 89,
    strategyOverview: "Hitam membiarkan Putih membangun sentrum luas lalu melancarkan serangan balik eksplosif di sayap raja melalui ...f5.",
    keyTactics: ["Serangan pion f5-f4 dan g5-g4", "Pengorbanan gajah di h3", "Counter-break sayap menteri Putih c5"],
    pawnStructure: "Sentrum terkunci (d5 vs e5) menghasilkan perlombaan sayap: Putih di sayap menteri, Hitam di sayap raja."
  },
  {
    eco: "B12",
    name: "Caro-Kann Defense: Advance Variation",
    moves: "e4 c6 d4 d5 e5 Bf5",
    movesArray: ["e4", "c6", "d4", "d5", "e5", "Bf5"],
    whiteWin: 40,
    draw: 35,
    blackWin: 25,
    totalGames: 210000,
    popularity: 84,
    strategyOverview: "Hitam mengembangkan gajah terang ke f5 sebelum menutup rantai pion dengan ...e6. Putih mencoba menekan gajah dengan h4 dan g4.",
    keyTactics: ["Pemerangkapan gajah f5 via g4-h4", "Pemberontakan sentrum ...c5", "Penguasaan petak lemah d5/f5"],
    pawnStructure: "Rantai pion kokoh c6/e6, kontrol Hitam pada petak gelap."
  },
  {
    eco: "C00",
    name: "French Defense: Winawer Variation",
    moves: "e4 e6 d4 d5 Nc3 Bb4",
    movesArray: ["e4", "e6", "d4", "d5", "Nc3", "Bb4"],
    whiteWin: 42,
    draw: 31,
    blackWin: 27,
    totalGames: 185000,
    popularity: 79,
    strategyOverview: "Posisi sangat tajam di mana Hitam melumpuhkan kuda c3 (pin) dan menargetkan struktur pion c3/c4 Putih.",
    keyTactics: ["Pin Bb4 terhadap Nc3", "Serangan Qg4 menekan g7", "Pengeboman c5 terhadap pusat d4"],
    pawnStructure: "Sentrum tertutup e5 vs d5; pion ganda Putih di c3/c4."
  },
  {
    eco: "D02",
    name: "London System",
    moves: "d4 d5 Bf4 Nf6 e3 c5 Nf3",
    movesArray: ["d4", "d5", "Bf4", "Nf6", "e3", "c5", "Nf3"],
    whiteWin: 39,
    draw: 37,
    blackWin: 24,
    totalGames: 450000,
    popularity: 95,
    strategyOverview: "Sistem solid untuk Putih dengan formasi piramida c3-d4-e3 dan gajah aktif di f4 sebelum e3 dimainkan.",
    keyTactics: ["Outpost Kuda di e5", "Manuver Serangan sayap raja Qh5 + Ng5", "Tusukan Qb3 menekan b7"],
    pawnStructure: "Piramida kokoh d4-e3-c3, minim kelemahan taktis dini."
  }
];

export function findOpening(movesHistory: string[]): OpeningStat | null {
  if (!movesHistory || movesHistory.length === 0) return null;
  
  let bestMatch: OpeningStat | null = null;
  let maxMatchLength = 0;

  for (const opening of OPENINGS_DATABASE) {
    let match = true;
    for (let i = 0; i < opening.movesArray.length; i++) {
      if (i >= movesHistory.length || movesHistory[i] !== opening.movesArray[i]) {
        match = false;
        break;
      }
    }
    if (match && opening.movesArray.length > maxMatchLength) {
      bestMatch = opening;
      maxMatchLength = opening.movesArray.length;
    }
  }

  return bestMatch;
}
