import { Chess } from 'chess.js';
import type { Square, PieceSymbol, Move } from 'chess.js';

export interface MoveAnalysis {
  ply: number;
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  from: string;
  to: string;
  fenBefore: string;
  fenAfter: string;
  evalBefore: number; // in centipawns (from White's perspective)
  evalAfter: number;  // in centipawns (from White's perspective)
  evalString: string; // e.g. "+1.4", "-0.8", "M2"
  bestMoveSan: string;
  bestMoveFrom: string;
  bestMoveTo: string;
  classification: MoveClassification;
  explanation: string;
  suggestedAlternative: string;
}

export type MoveClassification = 
  | 'brilliant' 
  | 'great' 
  | 'best' 
  | 'good' 
  | 'inaccuracy' 
  | 'mistake' 
  | 'blunder' 
  | 'missed_win' 
  | 'book';

export interface TacticalThreat {
  type: 'pin' | 'fork' | 'skewer' | 'hanging' | 'backrank' | 'check';
  description: string;
  targetSquare: string;
  sourceSquare?: string;
  severity: 'high' | 'medium' | 'low';
}

export interface EngineResult {
  score: number; // in centipawns from White perspective
  evalString: string;
  bestMove: {
    from: string;
    to: string;
    san: string;
    promotion?: string;
  } | null;
  line: string[];
  depth: number;
  tacticalEfficiency: number; // 0 - 100%
  threats: TacticalThreat[];
  tacticalAdvice: string;
}

// Material values in centipawns
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece Square Tables (White perspective, rank 8 to rank 1)
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_PST = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_PST = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_MIDGAME_PST = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

/**
 * Fast static evaluation in centipawns from White's perspective
 */
export function evaluatePosition(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -30000 : 30000;
  }
  if (chess.isDraw()) {
    return 0;
  }

  let whiteScore = 0;
  let blackScore = 0;

  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const baseValue = PIECE_VALUES[piece.type];
      const squareIndexWhite = r * 8 + c;
      const squareIndexBlack = (7 - r) * 8 + c;

      let pstBonus = 0;
      switch (piece.type) {
        case 'p':
          pstBonus = piece.color === 'w' ? PAWN_PST[squareIndexWhite] : PAWN_PST[squareIndexBlack];
          break;
        case 'n':
          pstBonus = piece.color === 'w' ? KNIGHT_PST[squareIndexWhite] : KNIGHT_PST[squareIndexBlack];
          break;
        case 'b':
          pstBonus = piece.color === 'w' ? BISHOP_PST[squareIndexWhite] : BISHOP_PST[squareIndexBlack];
          break;
        case 'r':
          pstBonus = piece.color === 'w' ? ROOK_PST[squareIndexWhite] : ROOK_PST[squareIndexBlack];
          break;
        case 'q':
          pstBonus = piece.color === 'w' ? QUEEN_PST[squareIndexWhite] : QUEEN_PST[squareIndexBlack];
          break;
        case 'k':
          pstBonus = piece.color === 'w' ? KING_MIDGAME_PST[squareIndexWhite] : KING_MIDGAME_PST[squareIndexBlack];
          break;
      }

      if (piece.color === 'w') {
        whiteScore += baseValue + pstBonus;
      } else {
        blackScore += baseValue + pstBonus;
      }
    }
  }

  // Slight tempo bonus for the side to move
  const tempoBonus = chess.turn() === 'w' ? 10 : -10;
  return (whiteScore - blackScore) + tempoBonus;
}

/**
 * Minimax with Alpha-Beta pruning for tactical analysis
 */
export function searchBestMove(chess: Chess, depth: number = 3): { score: number; bestMove: Move | null; line: string[] } {
  const isWhite = chess.turn() === 'w';
  const legalMoves = chess.moves({ verbose: true });

  if (legalMoves.length === 0) {
    return {
      score: evaluatePosition(chess),
      bestMove: null,
      line: []
    };
  }

  // Simple move ordering: captures and checks first
  legalMoves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.captured) scoreA += PIECE_VALUES[a.captured] * 10 - PIECE_VALUES[a.piece];
    if (b.captured) scoreB += PIECE_VALUES[b.captured] * 10 - PIECE_VALUES[b.piece];
    if (a.san.includes('+')) scoreA += 50;
    if (b.san.includes('+')) scoreB += 50;
    return scoreB - scoreA;
  });

  // Fast path for depth 1 (e.g. during batch game review)
  if (depth <= 1) {
    let bestScore = isWhite ? -Infinity : Infinity;
    let chosenMove = legalMoves[0];
    for (const move of legalMoves) {
      chess.move(move);
      const score = evaluatePosition(chess);
      chess.undo();
      if (isWhite ? score > bestScore : score < bestScore) {
        bestScore = score;
        chosenMove = move;
      }
    }
    return { score: bestScore, bestMove: chosenMove, line: [chosenMove.san] };
  }

  let bestMove: Move = legalMoves[0];
  let alpha = -Infinity;
  let beta = Infinity;
  let line: string[] = [bestMove.san];

  if (isWhite) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();

      if (evalScore > maxEval) {
        maxEval = evalScore;
        bestMove = move;
        line = [move.san];
      }
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return { score: maxEval, bestMove, line };
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();

      if (evalScore < minEval) {
        minEval = evalScore;
        bestMove = move;
        line = [move.san];
      }
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return { score: minEval, bestMove, line };
  }
}

function minimax(chess: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluatePosition(chess);
  }

  const legalMoves = chess.moves({ verbose: true });

  // Move ordering
  legalMoves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.captured) scoreA += PIECE_VALUES[a.captured] * 10 - PIECE_VALUES[a.piece];
    if (b.captured) scoreB += PIECE_VALUES[b.captured] * 10 - PIECE_VALUES[b.piece];
    return scoreB - scoreA;
  });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Detect tactical motifs and threats (pins, forks, hanging pieces)
 */
export function detectTacticsAndThreats(chess: Chess): TacticalThreat[] {
  const threats: TacticalThreat[] = [];
  const currentTurn = chess.turn();
  const opponentTurn = currentTurn === 'w' ? 'b' : 'w';

  // Check state
  if (chess.inCheck()) {
    threats.push({
      type: 'check',
      description: `Raja ${currentTurn === 'w' ? 'Putih' : 'Hitam'} sedang di-skak! Langkah respon bersifat wajib.`,
      targetSquare: findKingSquare(chess, currentTurn),
      severity: 'high'
    });
  }

  // Detect hanging pieces (pieces attacked with no defense or under-defended)
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.type === 'k') continue;

      const square = `${String.fromCharCode(97 + c)}${8 - r}` as Square;
      const isPlayerPiece = piece.color === currentTurn;

      // Check if square is attacked by opponent
      if (chess.isAttacked(square, opponentTurn)) {
        if (isPlayerPiece) {
          threats.push({
            type: 'hanging',
            description: `Perwira ${pieceNameIndo(piece.type)} di ${square} berada di bawah ancaman serang musuh.`,
            targetSquare: square,
            severity: piece.type === 'q' || piece.type === 'r' ? 'high' : 'medium'
          });
        }
      }
    }
  }

  // Detect forks and tactical skewers on legal moves
  const legalMoves = chess.moves({ verbose: true });
  for (const move of legalMoves.slice(0, 15)) {
    if (move.piece === 'n') {
      // Check if knight move attacks multiple major pieces
      chess.move(move);
      const attackedSquares = getKnightAttacks(move.to);
      let highValueTargets = 0;
      for (const sq of attackedSquares) {
        const targetPiece = chess.get(sq as Square);
        if (targetPiece && targetPiece.color === opponentTurn && (targetPiece.type === 'k' || targetPiece.type === 'q' || targetPiece.type === 'r')) {
          highValueTargets++;
        }
      }
      chess.undo();

      if (highValueTargets >= 2) {
        threats.push({
          type: 'fork',
          description: `Peluang Garpu Taktis (Fork): Kuda ke ${move.to} menyerang sekaligus 2 perwira utama lawan!`,
          targetSquare: move.to,
          sourceSquare: move.from,
          severity: 'high'
        });
        break;
      }
    }
  }

  return threats;
}

function findKingSquare(chess: Chess, color: 'w' | 'b'): string {
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'k' && piece.color === color) {
        return `${String.fromCharCode(97 + c)}${8 - r}`;
      }
    }
  }
  return 'e1';
}

function getKnightAttacks(square: string): string[] {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1], 10) - 1;
  const deltas = [
    [1, 2], [2, 1], [-1, 2], [-2, 1],
    [1, -2], [2, -1], [-1, -2], [-2, -1]
  ];
  const result: string[] = [];
  for (const [df, dr] of deltas) {
    const nf = file + df;
    const nr = rank + dr;
    if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
      result.push(`${String.fromCharCode(97 + nf)}${nr + 1}`);
    }
  }
  return result;
}

export function pieceNameIndo(type: PieceSymbol): string {
  switch (type) {
    case 'p': return 'Bidak';
    case 'n': return 'Kuda';
    case 'b': return 'Gajah';
    case 'r': return 'Benteng';
    case 'q': return 'Menteri';
    case 'k': return 'Raja';
  }
}

/**
 * Calculates Tactical Efficiency (0 - 100%)
 */
export function calculateTacticalEfficiency(scoreCentipawns: number, threatsCount: number, turn: 'w' | 'b'): number {
  const perspectiveScore = turn === 'w' ? scoreCentipawns : -scoreCentipawns;
  // Convert centipawns to normalized scale
  let baseEfficiency = 50 + (perspectiveScore / 20); // 0 cp -> 50%, +1000 cp -> 100%
  baseEfficiency = Math.max(5, Math.min(99, baseEfficiency));

  // Penalty if current side is under multiple undefended threats
  if (threatsCount > 1) {
    baseEfficiency = Math.max(10, baseEfficiency - threatsCount * 7);
  }

  return Math.round(baseEfficiency);
}

/**
 * Converts centipawns to standard display eval like +1.35 or -0.80 or M2
 */
export function formatEvaluation(score: number): string {
  if (score >= 25000) {
    const mateIn = Math.ceil((30000 - score) / 2);
    return `M${Math.max(1, mateIn)}`;
  }
  if (score <= -25000) {
    const mateIn = Math.ceil((30000 + score) / 2);
    return `-M${Math.max(1, mateIn)}`;
  }
  const pawns = (score / 100).toFixed(1);
  return score > 0 ? `+${pawns}` : `${pawns}`;
}

/**
 * Win probability formula from centipawns eval
 */
export function getWinProbability(centipawns: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * centipawns)) - 1);
}

/**
 * Classify a move based on win probability loss and tactical sacrifice
 */
export function classifyMove(
  evalBefore: number,
  evalAfter: number,
  playerColor: 'w' | 'b',
  moveSan: string,
  bestMoveSan: string,
  isCaptureOrSacrifice: boolean = false
): { classification: MoveClassification; explanation: string } {
  // Normalize evals to player's perspective
  const pEvalBefore = playerColor === 'w' ? evalBefore : -evalBefore;
  const pEvalAfter = playerColor === 'w' ? evalAfter : -evalAfter;

  const winProbBefore = getWinProbability(pEvalBefore);
  const winProbAfter = getWinProbability(pEvalAfter);
  const winProbLoss = winProbBefore - winProbAfter;
  const evalDiff = pEvalAfter - pEvalBefore;

  // Exact best move or very close
  if (moveSan === bestMoveSan || evalDiff >= -15) {
    if (isCaptureOrSacrifice && pEvalAfter > 150 && winProbBefore < 60) {
      return {
        classification: 'brilliant',
        explanation: `Langkah brilian! ${moveSan} melepaskan perwira untuk inisiatif serangan mematikan.`
      };
    }
    if (winProbLoss <= 0 && evalDiff > 80) {
      return {
        classification: 'great',
        explanation: `Langkah luar biasa! ${moveSan} memperbesar tekanan taktis secara signifikan.`
      };
    }
    return {
      classification: 'best',
      explanation: `Langkah terbaik mesin (${moveSan}), mempertahankan kontrol optimal atas posisi.`
    };
  }

  // Moderate eval loss
  if (winProbLoss <= 4) {
    return {
      classification: 'good',
      explanation: `Langkah bagus (${moveSan}), mempertahankan keseimbangan posisi dengan aman.`
    };
  }

  if (winProbLoss <= 12) {
    return {
      classification: 'inaccuracy',
      explanation: `Kurang akurat. ${moveSan} melepaskan sedikit inisiatif dibandingkan alternatif ${bestMoveSan}.`
    };
  }

  if (winProbLoss <= 25) {
    return {
      classification: 'mistake',
      explanation: `Kesalahan posisi. ${moveSan} membiarkan lawan mendapatkan keunggulan taktis. Sebaiknya ${bestMoveSan}.`
    };
  }

  // Large swing or missing mate
  if (pEvalBefore > 300 && pEvalAfter < 0) {
    return {
      classification: 'missed_win',
      explanation: `Kemenangan terlewat! Posisi Anda sangat unggul sebelum ${moveSan}. Langkah pemenang adalah ${bestMoveSan}.`
    };
  }

  return {
    classification: 'blunder',
    explanation: `Blunder fatal! ${moveSan} menurunkan probabilitas menang secara drastis (${Math.round(winProbLoss)}% swing). Solusi tepat: ${bestMoveSan}.`
  };
}

/**
 * Calculates CAPS accuracy for a game
 */
export function calculatePlayerAccuracy(moves: MoveAnalysis[], color: 'w' | 'b'): number {
  const playerMoves = moves.filter(m => m.color === color);
  if (playerMoves.length === 0) return 80;

  let totalScore = 0;
  for (const m of playerMoves) {
    switch (m.classification) {
      case 'brilliant': totalScore += 100; break;
      case 'great': totalScore += 98; break;
      case 'best': totalScore += 95; break;
      case 'book': totalScore += 95; break;
      case 'good': totalScore += 82; break;
      case 'inaccuracy': totalScore += 65; break;
      case 'mistake': totalScore += 40; break;
      case 'blunder': totalScore += 15; break;
      case 'missed_win': totalScore += 20; break;
    }
  }

  return parseFloat((totalScore / playerMoves.length).toFixed(1));
}
