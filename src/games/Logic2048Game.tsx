import React, { useEffect, useState, useCallback } from 'react';
import { GameProps, GameState } from '../types/arcade';
import { soundFX } from '../utils/sound';
import { Play, RotateCcw, Undo2 } from 'lucide-react';

type Board = number[][];

const emptyBoard = (): Board => [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

const addRandomTile = (b: Board): Board => {
  const next = b.map((row) => [...row]);
  const emptyCells: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (next[r][c] === 0) emptyCells.push([r, c]);
    }
  }
  if (emptyCells.length === 0) return next;
  const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  next[r][c] = Math.random() < 0.88 ? 2 : 4;
  return next;
};

const canMove = (b: Board): boolean => {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (b[r][c] === 0) return true;
      if (c < 3 && b[r][c] === b[r][c + 1]) return true;
      if (r < 3 && b[r][c] === b[r + 1][c]) return true;
    }
  }
  return false;
};

export const Logic2048Game: React.FC<GameProps> = ({
  highScore,
  onGameOver,
}) => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [score, setScore] = useState(0);
  const [undoStack, setUndoStack] = useState<{ board: Board; score: number }[]>([]);
  const [undosLeft, setUndosLeft] = useState(3);

  const startMatrix = useCallback(() => {
    const b1 = addRandomTile(emptyBoard());
    const b2 = addRandomTile(b1);
    setBoard(b2);
    setScore(0);
    setUndoStack([]);
    setUndosLeft(3);
    setGameState('PLAYING');
    soundFX.playBoost();
  }, []);

  const slideRowLeft = (row: number[]): { newRow: number[]; gained: number } => {
    const nonZero = row.filter((n) => n !== 0);
    const merged: number[] = [];
    let gained = 0;
    let i = 0;
    while (i < nonZero.length) {
      if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
        const val = nonZero[i] * 2;
        merged.push(val);
        gained += val;
        i += 2;
      } else {
        merged.push(nonZero[i]);
        i += 1;
      }
    }
    while (merged.length < 4) merged.push(0);
    return { newRow: merged, gained };
  };

  const rotateRight = (b: Board): Board =>
    b[0].map((_, colIdx) => b.map((row) => row[colIdx]).reverse());

  const rotateLeft = (b: Board): Board =>
    b[0].map((_, colIdx) => b.map((row) => row[3 - colIdx]));

  const makeMove = useCallback(
    (dir: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN') => {
      if (gameState !== 'PLAYING') return;

      let working = board.map((r) => [...r]);
      if (dir === 'RIGHT') working = working.map((r) => [...r].reverse());
      if (dir === 'UP') working = rotateLeft(working);
      if (dir === 'DOWN') working = rotateRight(working);

      let totalGained = 0;
      const slid = working.map((row) => {
        const { newRow, gained } = slideRowLeft(row);
        totalGained += gained;
        return newRow;
      });

      let restored = slid;
      if (dir === 'RIGHT') restored = slid.map((r) => [...r].reverse());
      if (dir === 'UP') restored = rotateRight(slid);
      if (dir === 'DOWN') restored = rotateLeft(slid);

      const changed = JSON.stringify(restored) !== JSON.stringify(board);
      if (!changed) return;

      setUndoStack((prev) => [...prev.slice(-4), { board, score }]);
      const withSpawn = addRandomTile(restored);
      const nextScore = score + totalGained;
      setBoard(withSpawn);
      setScore(nextScore);

      if (totalGained > 0) soundFX.playMerge();
      else soundFX.playMove();

      if (!canMove(withSpawn)) {
        const maxTile = Math.max(...withSpawn.flat());
        soundFX.playGameOver();
        setGameState('GAME_OVER');
        onGameOver(nextScore, `Max Core ${maxTile}`);
      }
    },
    [board, score, gameState, onGameOver]
  );

  const handleUndo = () => {
    if (undosLeft <= 0 || undoStack.length === 0 || gameState !== 'PLAYING') return;
    const prev = undoStack[undoStack.length - 1];
    setBoard(prev.board);
    setScore(prev.score);
    setUndoStack((s) => s.slice(0, -1));
    setUndosLeft((u) => u - 1);
    soundFX.playMove();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') makeMove('LEFT');
      if (e.code === 'ArrowRight' || e.code === 'KeyD') makeMove('RIGHT');
      if (e.code === 'ArrowUp' || e.code === 'KeyW') makeMove('UP');
      if (e.code === 'ArrowDown' || e.code === 'KeyS') makeMove('DOWN');
      if (e.code === 'KeyZ') handleUndo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const getTileStyles = (val: number) => {
    if (val === 0) return 'bg-slate-900/60 border-slate-800/70 text-transparent';
    if (val <= 4) return 'bg-slate-800 border-slate-700 text-slate-100';
    if (val <= 16) return 'bg-cyan-950 border-cyan-500/60 text-cyan-300';
    if (val <= 64) return 'bg-pink-950 border-pink-500/60 text-pink-300';
    if (val <= 256) return 'bg-amber-950 border-amber-500/70 text-amber-300';
    return 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-lg';
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* HUD */}
      <div className="w-full max-w-[700px] bg-slate-900/90 border border-slate-800 rounded-t-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[11px] text-slate-400">Synthesis Score</div>
            <div className="text-lg font-bold font-mono tabular-nums text-cyan-400">
              {score.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Personal Best</div>
            <div className="text-lg font-bold font-mono tabular-nums text-amber-400">
              {Math.max(score, highScore).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Peak Node</div>
            <div className="text-lg font-bold font-mono tabular-nums text-pink-400">
              {Math.max(2, ...board.flat())}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={undosLeft <= 0 || undoStack.length === 0 || gameState !== 'PLAYING'}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo ({undosLeft})
          </button>
          <button
            onClick={startMatrix}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Board Container */}
      <div className="relative w-full max-w-[700px] min-h-[480px] bg-[#070B14] border-x border-b border-slate-800 rounded-b-xl p-6 flex flex-col items-center justify-center">
        <div className="grid grid-cols-4 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-[380px] aspect-square">
          {board.map((row, rIdx) =>
            row.map((val, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`flex items-center justify-center rounded-xl border-2 font-mono tabular-nums font-bold text-2xl transition-transform duration-150 ${getTileStyles(
                  val
                )}`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          )}
        </div>

        {/* Directional Controls */}
        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={() => makeMove('LEFT')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 whitespace-nowrap shrink-0"
          >
            Slide Left (←)
          </button>
          <button
            onClick={() => makeMove('UP')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 whitespace-nowrap shrink-0"
          >
            Slide Up (↑)
          </button>
          <button
            onClick={() => makeMove('DOWN')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 whitespace-nowrap shrink-0"
          >
            Slide Down (↓)
          </button>
          <button
            onClick={() => makeMove('RIGHT')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 whitespace-nowrap shrink-0"
          >
            Slide Right (→)
          </button>
        </div>

        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-b-xl">
            <h2 className="text-3xl font-bold font-display text-white">2048 Logic Core</h2>
            <p className="text-sm text-slate-300 max-w-md mt-2">
              Slide and merge matching quantum power nodes using WASD or Arrow keys. Includes 3 tactical Undo charges per run.
            </p>
            <button
              onClick={startMatrix}
              className="mt-6 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Game
            </button>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-b-xl">
            <h3 className="text-3xl font-bold font-display text-white">Matrix Locked</h3>
            <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div>
                <div className="text-xs text-slate-400">Final Score</div>
                <div className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-0.5">
                  {score.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Peak Node</div>
                <div className="text-xl font-bold font-mono tabular-nums text-amber-400 mt-0.5">
                  {Math.max(2, ...board.flat())}
                </div>
              </div>
            </div>
            <button
              onClick={startMatrix}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
