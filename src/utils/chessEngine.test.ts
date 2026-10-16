import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { 
  evaluatePosition, 
  searchBestMove, 
  detectTacticsAndThreats, 
  calculateTacticalEfficiency,
  classifyMove,
  formatEvaluation 
} from './chessEngine.ts';
import { findOpening, OPENINGS_DATABASE } from './openingsData.ts';

test('initial chess position evaluation is close to zero', () => {
  const chess = new Chess();
  const evalScore = evaluatePosition(chess);
  // Initial position should be balanced (-50 to +50 centipawns)
  assert.ok(Math.abs(evalScore) < 60, `Eval should be near 0, got ${evalScore}`);
});

test('checkmate position gives extreme evaluation', () => {
  // Scholar's mate
  const chess = new Chess();
  chess.move('e4');
  chess.move('e5');
  chess.move('Qh5');
  chess.move('Nc6');
  chess.move('Bc4');
  chess.move('Nf6');
  chess.move('Qxf7#');

  assert.equal(chess.isCheckmate(), true);
  const evalScore = evaluatePosition(chess);
  assert.equal(evalScore, 30000);
});

test('searchBestMove finds tactical winning moves', () => {
  // White has mate in 1
  const chess = new Chess('r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1');
  // Qxf7# is available
  const result = searchBestMove(chess, 2);
  assert.ok(result.bestMove !== null);
  assert.equal(result.bestMove.san, 'Qxf7#');
});

test('detectTacticsAndThreats detects inCheck', () => {
  // King under check
  const chess = new Chess('rnbqkbnr/ppppp2p/8/5ppQ/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 3');
  assert.equal(chess.inCheck(), true);
  const threats = detectTacticsAndThreats(chess);
  const checkThreat = threats.find(t => t.type === 'check');
  assert.ok(checkThreat !== undefined);
});

test('tactical efficiency converts to realistic percentage', () => {
  const effEqual = calculateTacticalEfficiency(0, 0, 'w');
  assert.equal(effEqual, 50);

  const effWinning = calculateTacticalEfficiency(600, 0, 'w');
  assert.ok(effWinning > 75);

  const effUnderThreat = calculateTacticalEfficiency(0, 2, 'w');
  assert.ok(effUnderThreat < 40);
});

test('formatEvaluation produces human readable notation', () => {
  assert.equal(formatEvaluation(150), '+1.5');
  assert.equal(formatEvaluation(-80), '-0.8');
  assert.equal(formatEvaluation(29998), 'M1');
  assert.equal(formatEvaluation(-29998), '-M1');
});

test('classifyMove detects blunders and best moves', () => {
  const best = classifyMove(100, 100, 'w', 'Nf3', 'Nf3');
  assert.equal(best.classification, 'best');

  const blunder = classifyMove(100, -500, 'w', 'Qxh7', 'Nf3');
  assert.equal(blunder.classification, 'blunder');
});

test('findOpening identifies Sicilian and Ruy Lopez', () => {
  const sicilianMoves = ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'];
  const match = findOpening(sicilianMoves);
  assert.ok(match !== null);
  assert.equal(match.eco, 'B90');
  assert.equal(match.name, 'Sicilian Defense: Najdorf Variation');
});

test('analyzePgnGame analyzes game and computes accuracy', async () => {
  const { analyzePgnGame, SAMPLE_GAMES } = await import('./sampleGames.ts');
  const game = SAMPLE_GAMES[2]; // Club player game
  const analyzed = analyzePgnGame(game);
  assert.ok(analyzed.moves.length > 20);
  assert.ok(analyzed.whiteAccuracy > 0 && analyzed.whiteAccuracy <= 100);
  assert.ok(analyzed.blackAccuracy > 0 && analyzed.blackAccuracy <= 100);
  assert.ok(analyzed.blundersList.length > 0);
});
