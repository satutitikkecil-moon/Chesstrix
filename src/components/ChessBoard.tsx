import React, { useState } from 'react';
import { Chess } from 'chess.js';
import type { Square, Move } from 'chess.js';
import { ChessPiece } from './ChessPieces.tsx';
import { playChessSound } from '../utils/chessAudio.ts';

interface ChessBoardProps {
  fen: string;
  orientation?: 'w' | 'b';
  lastMove?: { from: string; to: string } | null;
  bestMoveArrow?: { from: string; to: string } | null;
  threatArrow?: { from: string; to: string } | null;
  interactive?: boolean;
  onMove?: (move: { from: string; to: string; promotion?: string }) => void;
  checkSquare?: string | null;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  orientation = 'w',
  lastMove,
  bestMoveArrow,
  threatArrow,
  interactive = true,
  onMove,
  checkSquare
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  // Initialize a chess instance to get legal moves for selected square
  const chess = React.useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  const legalMoves = React.useMemo(() => {
    if (!selectedSquare || !interactive) return [];
    return chess.moves({ square: selectedSquare, verbose: true });
  }, [selectedSquare, chess, interactive]);

  const board = chess.board();

  const handleSquareClick = (square: Square) => {
    if (!interactive) return;

    if (selectedSquare) {
      // Check if clicked square is a legal destination
      const validMove = legalMoves.find(m => m.to === square);
      if (validMove) {
        if (onMove) {
          onMove({
            from: selectedSquare,
            to: square,
            promotion: validMove.flags.includes('p') ? 'q' : undefined
          });
          if (validMove.captured) {
            playChessSound('capture');
          } else {
            playChessSound('move');
          }
        }
        setSelectedSquare(null);
        return;
      }
    }

    // Otherwise, select piece if it matches the side to move
    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      playChessSound('move');
    } else {
      setSelectedSquare(null);
    }
  };

  const ranks = orientation === 'w' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const files = orientation === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  // Helper for arrow calculations
  const getSquareCoordinates = (sq: string) => {
    const file = sq.charCodeAt(0) - 97;
    const rank = parseInt(sq[1], 10) - 1;
    const xIndex = orientation === 'w' ? file : 7 - file;
    const yIndex = orientation === 'w' ? 7 - rank : rank;
    return {
      x: xIndex * 12.5 + 6.25,
      y: yIndex * 12.5 + 6.25
    };
  };

  return (
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800/80 bg-slate-900 select-none">
      {/* 8x8 Board Grid */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {ranks.map((r) =>
          files.map((c) => {
            const squareName = `${String.fromCharCode(97 + c)}${r + 1}` as Square;
            const isLightSquare = (r + c) % 2 !== 0;
            const piece = board[7 - r][c];
            const isSelected = selectedSquare === squareName;
            const isLastMove = lastMove && (lastMove.from === squareName || lastMove.to === squareName);
            const isCheck = checkSquare === squareName;
            const legalTarget = legalMoves.find(m => m.to === squareName);

            return (
              <button
                key={squareName}
                type="button"
                aria-label={`Petak ${squareName}${piece ? ` ${piece.color === 'w' ? 'Putih' : 'Hitam'} ${piece.type}` : ''}`}
                onClick={() => handleSquareClick(squareName)}
                className={`relative flex items-center justify-center transition-colors duration-150 p-1 cursor-pointer focus:outline-none ${
                  isLightSquare
                    ? 'bg-[#E3E8EC]' // Material Tonal light square
                    : 'bg-[#6F8695]' // Material Tonal dark slate-blue
                } ${
                  isSelected ? '!bg-amber-400/80 ring-2 ring-inset ring-amber-500' : ''
                } ${
                  isLastMove ? '!bg-emerald-400/50' : ''
                } ${
                  isCheck ? '!bg-rose-500/80 animate-pulse' : ''
                }`}
              >
                {/* Board Rank Label (on leftmost column) */}
                {(orientation === 'w' ? c === 0 : c === 7) && (
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] font-bold pointer-events-none ${
                      isLightSquare ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {r + 1}
                  </span>
                )}

                {/* Board File Label (on bottommost row) */}
                {(orientation === 'w' ? r === 0 : r === 7) && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] font-bold pointer-events-none ${
                      isLightSquare ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {String.fromCharCode(97 + c)}
                  </span>
                )}

                {/* Legal move destination indicator */}
                {legalTarget && (
                  <div
                    className={`absolute z-10 pointer-events-none rounded-full ${
                      legalTarget.captured
                        ? 'w-10 h-10 border-4 border-emerald-500/80'
                        : 'w-4 h-4 bg-emerald-600/70 shadow-sm'
                    }`}
                  />
                )}

                {/* Chess piece */}
                {piece && (
                  <div className="w-full h-full flex items-center justify-center z-1 transition-transform active:scale-95">
                    <ChessPiece type={piece.type} color={piece.color} />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* SVG Overlay for Tactical Arrows (Best Move & Threat) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        viewBox="0 0 100 100"
      >
        <defs>
          <marker
            id="arrowhead-best"
            markerWidth="4"
            markerHeight="4"
            refX="2"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 4 2, 0 4" fill="#10B981" />
          </marker>
          <marker
            id="arrowhead-threat"
            markerWidth="4"
            markerHeight="4"
            refX="2"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 4 2, 0 4" fill="#F43F5E" />
          </marker>
        </defs>

        {/* Best Move Arrow (Emerald) */}
        {bestMoveArrow && (
          (() => {
            const from = getSquareCoordinates(bestMoveArrow.from);
            const to = getSquareCoordinates(bestMoveArrow.to);
            return (
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#10B981"
                strokeWidth="2.8"
                strokeLinecap="round"
                markerEnd="url(#arrowhead-best)"
                opacity="0.85"
                className="drop-shadow-md"
              />
            );
          })()
        )}

        {/* Threat Arrow (Rose/Red) */}
        {threatArrow && (
          (() => {
            const from = getSquareCoordinates(threatArrow.from);
            const to = getSquareCoordinates(threatArrow.to);
            return (
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#F43F5E"
                strokeWidth="2.5"
                strokeDasharray="2,1"
                strokeLinecap="round"
                markerEnd="url(#arrowhead-threat)"
                opacity="0.9"
                className="drop-shadow-md"
              />
            );
          })()
        )}
      </svg>
    </div>
  );
};
