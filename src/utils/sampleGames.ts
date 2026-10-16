import { Chess } from 'chess.js';
import { 
  evaluatePosition, 
  searchBestMove, 
  classifyMove, 
  formatEvaluation, 
  calculatePlayerAccuracy
} from './chessEngine.ts';
import type { MoveAnalysis } from './chessEngine.ts';
import { findOpening } from './openingsData.ts';

export interface GameMetadata {
  id: string;
  title: string;
  event: string;
  date: string;
  white: {
    username: string;
    rating: number;
    avatar?: string;
  };
  black: {
    username: string;
    rating: number;
    avatar?: string;
  };
  result: string; // "1-0", "0-1", "1/2-1/2"
  timeControl: string;
  openingName: string;
  eco: string;
  pgn: string;
}

export interface AnalyzedGame {
  metadata: GameMetadata;
  moves: MoveAnalysis[];
  whiteAccuracy: number;
  blackAccuracy: number;
  classificationsCount: {
    w: Record<string, number>;
    b: Record<string, number>;
  };
  blundersList: MoveAnalysis[];
}

export const SAMPLE_GAMES: GameMetadata[] = [
  {
    id: "game_sample_1",
    title: "Hikaru Nakamura vs Magnus Carlsen (Speed Chess)",
    event: "Chess.com Speed Chess Championship",
    date: "2024.09.12",
    white: {
      username: "Hikaru",
      rating: 3240,
      avatar: "https://images.chesscomfiles.com/uploads/v1/user/15448422.062a4fa9.200x200o.e38bb64be3fd.png"
    },
    black: {
      username: "MagnusCarlsen",
      rating: 3280,
      avatar: "https://images.chesscomfiles.com/uploads/v1/user/3889224.a9b036fc.200x200o.b0114b0b1c97.png"
    },
    result: "1-0",
    timeControl: "3+1 Blitz",
    openingName: "Sicilian Defense: Najdorf",
    eco: "B90",
    pgn: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. Qd2 Nbd7 9. O-O-O Be7 10. f3 h5 11. Kb1 Rc8 12. Nd5 Nxd5 13. exd5 Bf5 14. Bd3 Bxd3 15. Qxd3 Bg5 16. Bf2 O-O 17. h4 Bh6 18. g4 hxg4 19. fxg4 Bf4 20. g5 Re8 21. Rde1 b5 22. g6 f6 23. h5 Bh6 24. Be3 Bxe3 25. Rxe3 e4 26. Rxe4 Rxe4 27. Qxe4 Qe8 28. Qf5 Nf8 29. Nd4 Rc4 30. Ne6 Nxe6 31. dxe6 Rc5 32. Qe4 Re5 33. Qb7 Rxe6 34. a3 Re1+ 35. Rxe1 Qxe1+ 36. Ka2 Qe6+ 37. b3 Kf8 38. h6 gxh6 39. Qh7 Qg8 40. Qxh6+ Qg7 41. Qh5 Ke7 42. Qf5 Qh8 43. Qe4+ Kd7 44. Qb7+ Ke6 45. Qf7+ 1-0"
  },
  {
    id: "game_sample_2",
    title: "Levy Rozman (GothamChess) vs Daniel Naroditsky",
    event: "Chess.com Titled Tuesday",
    date: "2024.11.05",
    white: {
      username: "GothamChess",
      rating: 2720
    },
    black: {
      username: "DanielNaroditsky",
      rating: 2980
    },
    result: "0-1",
    timeControl: "3+1 Blitz",
    openingName: "Caro-Kann Defense",
    eco: "B12",
    pgn: "1. e4 c6 2. d4 d5 3. e5 Bf5 4. h4 h5 5. Bd3 Bxd3 6. Qxd3 e6 7. Bg5 Qa5+ 8. Nd2 Qa6 9. c4 Ne7 10. Ngf3 Nd7 11. O-O Nf5 12. Rfc1 Bb4 13. b3 O-O 14. Nf1 f6 15. exf6 gxf6 16. Bf4 Rf7 17. Ng3 Nxg3 18. Bxg3 Rg7 19. Qe3 Re8 20. Qh6 e5 21. dxe5 fxe5 22. Qxh5 Nf6 23. Qf5 Ne4 24. Bxe5 Rf7 25. Qg6+ Kf8 26. cxd5 cxd5 27. Qxa6 bxa6 28. Bd4 Bd6 29. Rc6 Bf4 30. Rd1 a5 31. g3 Bxg3 32. fxg3 Rxf3 33. Rf1 Rxf1+ 34. Kxf1 Nxg3+ 35. Kg2 Ne4 36. Ra6 Re7 37. Rxa7 Rxa7 38. Bxa7 Nc3 39. a4 Ne2 40. Kf3 Nc1 41. Ke3 Nxb3 42. Kd3 Kf7 43. Kc3 Nc1 44. Kd4 Ke6 45. Kc5 Nb3+ 46. Kb5 d4 47. Kc4 d3 48. Kxd3 Kd5 49. Bb6 Nc1+ 50. Ke3 0-1"
  },
  {
    id: "game_sample_3",
    title: "Club Player Practice: Review Kesalahan & Blunder",
    event: "Live 10-Minute Rapid Match",
    date: "2024.12.01",
    white: {
      username: "TactixUser_ID",
      rating: 1350
    },
    black: {
      username: "ChessOpponent99",
      rating: 1380
    },
    result: "0-1",
    timeControl: "10 min Rapid",
    openingName: "Italian Game: Giuoco Piano",
    eco: "C50",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Bd2 Bxd2+ 8. Nbxd2 d5 9. exd5 Nxd5 10. O-O O-O 11. Re1 Bg4 12. Qb3 Na5 13. Qb5 c6 14. Qa4 b5 15. Bxb5 cxb5 16. Qxb5 Rb8 17. Qd3 Rxb2 18. Ne5 Be6 19. Ne4 Nf4 20. Qf3 Ng6 21. Rad1 Bd5 22. Qc3 Rxa2 23. Nxg6 hxg6 24. Nc5 Qg5 25. g3 Qf5 26. f4 Qh3 0-1"
  }
];

/**
 * Analyzes a full PGN game move by move
 */
export function analyzePgnGame(metadata: GameMetadata): AnalyzedGame {
  const chess = new Chess();
  chess.loadPgn(metadata.pgn);
  const history = chess.history({ verbose: true });

  const tempChess = new Chess();
  const analyzedMoves: MoveAnalysis[] = [];
  const blundersList: MoveAnalysis[] = [];

  const classificationsCount: {
    w: Record<string, number>;
    b: Record<string, number>;
  } = {
    w: { brilliant: 0, great: 0, best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, missed_win: 0, book: 0 },
    b: { brilliant: 0, great: 0, best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, missed_win: 0, book: 0 }
  };

  const movesSanList: string[] = [];

  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    const color = move.color;
    const moveNumber = Math.floor(i / 2) + 1;
    const fenBefore = tempChess.fen();
    const evalBefore = evaluatePosition(tempChess);

    // Compute best move before player moved (fast 1-ply search)
    const engineSearch = searchBestMove(tempChess, 1);
    const bestMoveSan = engineSearch.bestMove ? engineSearch.bestMove.san : move.san;
    const bestMoveFrom = engineSearch.bestMove ? engineSearch.bestMove.from : move.from;
    const bestMoveTo = engineSearch.bestMove ? engineSearch.bestMove.to : move.to;

    // Apply move
    tempChess.move(move);
    movesSanList.push(move.san);
    const fenAfter = tempChess.fen();
    const evalAfter = evaluatePosition(tempChess);

    // Check if in known opening book
    const isBook = i < 8 && findOpening(movesSanList) !== null;

    let classificationInfo = classifyMove(
      evalBefore, 
      evalAfter, 
      color, 
      move.san, 
      bestMoveSan,
      !!move.captured
    );

    if (isBook && classificationInfo.classification !== 'blunder') {
      classificationInfo = {
        classification: 'book',
        explanation: `Langkah teori pembukaan terdaftar dalam database master.`
      };
    }

    const moveAnalysis: MoveAnalysis = {
      ply: i + 1,
      moveNumber,
      color,
      san: move.san,
      from: move.from,
      to: move.to,
      fenBefore,
      fenAfter,
      evalBefore,
      evalAfter,
      evalString: formatEvaluation(evalAfter),
      bestMoveSan,
      bestMoveFrom,
      bestMoveTo,
      classification: classificationInfo.classification,
      explanation: classificationInfo.explanation,
      suggestedAlternative: bestMoveSan !== move.san ? `Disarankan: ${bestMoveSan}` : 'Langkah optimal terpilih.'
    };

    analyzedMoves.push(moveAnalysis);
    classificationsCount[color][classificationInfo.classification] = (classificationsCount[color][classificationInfo.classification] || 0) + 1;

    if (
      classificationInfo.classification === 'blunder' || 
      classificationInfo.classification === 'mistake' || 
      classificationInfo.classification === 'inaccuracy' ||
      classificationInfo.classification === 'missed_win'
    ) {
      blundersList.push(moveAnalysis);
    }
  }

  const whiteAccuracy = calculatePlayerAccuracy(analyzedMoves, 'w');
  const blackAccuracy = calculatePlayerAccuracy(analyzedMoves, 'b');

  return {
    metadata,
    moves: analyzedMoves,
    whiteAccuracy,
    blackAccuracy,
    classificationsCount,
    blundersList
  };
}
