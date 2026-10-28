import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameProps, GameState } from '../types/arcade';
import { soundFX } from '../utils/sound';
import { Play, RotateCcw, Pause, Zap } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

const COLS = 28;
const ROWS = 20;
const CELL = 25;

export const NeonViperGame: React.FC<GameProps> = ({
  highScore,
  onGameOver,
}) => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [viperLength, setViperLength] = useState(4);
  const [speedMode, setSpeedMode] = useState<'STANDARD' | 'OVERCLOCK'>('STANDARD');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    snake: [
      { x: 12, y: 10 },
      { x: 11, y: 10 },
      { x: 10, y: 10 },
      { x: 9, y: 10 },
    ] as Point[],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    orb: { x: 19, y: 10 } as Point,
    bonusOrb: null as (Point & { timer: number }) | null,
    score: 0,
    combo: 1,
    comboExpiry: 0,
  });

  const spawnOrb = (snake: Point[]): Point => {
    while (true) {
      const candidate = {
        x: 1 + Math.floor(Math.random() * (COLS - 2)),
        y: 1 + Math.floor(Math.random() * (ROWS - 2)),
      };
      if (!snake.some((s) => s.x === candidate.x && s.y === candidate.y)) {
        return candidate;
      }
    }
  };

  const startViper = useCallback(() => {
    const initialSnake = [
      { x: 12, y: 10 },
      { x: 11, y: 10 },
      { x: 10, y: 10 },
      { x: 9, y: 10 },
    ];
    stateRef.current = {
      snake: initialSnake,
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      orb: spawnOrb(initialSnake),
      bonusOrb: null,
      score: 0,
      combo: 1,
      comboExpiry: 0,
    };
    setScore(0);
    setCombo(1);
    setViperLength(4);
    setGameState('PLAYING');
    soundFX.playBoost();
  }, []);

  const changeDirection = useCallback((nx: number, ny: number) => {
    const cur = stateRef.current.dir;
    if (cur.x + nx !== 0 || cur.y + ny !== 0) {
      stateRef.current.nextDir = { x: nx, y: ny };
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') changeDirection(0, -1);
      if (e.code === 'ArrowDown' || e.code === 'KeyS') changeDirection(0, 1);
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') changeDirection(-1, 0);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') changeDirection(1, 0);
      if ((e.code === 'KeyP' || e.code === 'Escape') && gameState === 'PLAYING') {
        setGameState('PAUSED');
      } else if ((e.code === 'KeyP' || e.code === 'Escape') && gameState === 'PAUSED') {
        setGameState('PLAYING');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, changeDirection]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const tickInterval = speedMode === 'OVERCLOCK' ? 75 : 105;
    const timer = setInterval(() => {
      const s = stateRef.current;
      s.dir = s.nextDir;

      let nx = s.snake[0].x + s.dir.x;
      let ny = s.snake[0].y + s.dir.y;

      // Warp Portal Wrap-around on borders
      if (nx < 0) nx = COLS - 1;
      if (nx >= COLS) nx = 0;
      if (ny < 0) ny = ROWS - 1;
      if (ny >= ROWS) ny = 0;

      // Check self-collision
      if (s.snake.some((seg) => seg.x === nx && seg.y === ny)) {
        soundFX.playGameOver();
        setGameState('GAME_OVER');
        onGameOver(s.score, `Length ${s.snake.length}`);
        return;
      }

      const newHead = { x: nx, y: ny };
      s.snake.unshift(newHead);

      const now = Date.now();
      if (now > s.comboExpiry && s.combo > 1) {
        s.combo = 1;
        setCombo(1);
      }

      if (nx === s.orb.x && ny === s.orb.y) {
        soundFX.playPickup();
        if (now <= s.comboExpiry) {
          s.combo = Math.min(5, s.combo + 1);
        } else {
          s.combo = 1;
        }
        s.comboExpiry = now + 4500;
        s.score += 100 * s.combo;
        s.orb = spawnOrb(s.snake);

        if (!s.bonusOrb && Math.random() < 0.3) {
          const p = spawnOrb(s.snake);
          s.bonusOrb = { ...p, timer: 45 };
        }

        setScore(s.score);
        setCombo(s.combo);
        setViperLength(s.snake.length);
      } else if (s.bonusOrb && nx === s.bonusOrb.x && ny === s.bonusOrb.y) {
        soundFX.playMerge();
        s.score += 350;
        s.bonusOrb = null;
        setScore(s.score);
        setViperLength(s.snake.length);
      } else {
        s.snake.pop();
      }

      if (s.bonusOrb) {
        s.bonusOrb.timer -= 1;
        if (s.bonusOrb.timer <= 0) s.bonusOrb = null;
      }

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#071118';
          ctx.fillRect(0, 0, 700, 500);

          // Grid lines
          ctx.strokeStyle = '#0F293A';
          ctx.lineWidth = 1;
          for (let c = 0; c <= COLS; c++) {
            ctx.beginPath();
            ctx.moveTo(c * CELL, 0);
            ctx.lineTo(c * CELL, 500);
            ctx.stroke();
          }
          for (let r = 0; r <= ROWS; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * CELL);
            ctx.lineTo(700, r * CELL);
            ctx.stroke();
          }

          // Data Orb
          ctx.fillStyle = '#22D3EE';
          ctx.beginPath();
          ctx.arc(
            s.orb.x * CELL + CELL / 2,
            s.orb.y * CELL + CELL / 2,
            9,
            0,
            Math.PI * 2
          );
          ctx.fill();

          // Bonus Golden Orb
          if (s.bonusOrb) {
            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.arc(
              s.bonusOrb.x * CELL + CELL / 2,
              s.bonusOrb.y * CELL + CELL / 2,
              10,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }

          // Viper Segments
          s.snake.forEach((seg, idx) => {
            ctx.fillStyle = idx === 0 ? '#34D399' : '#10B981';
            ctx.beginPath();
            ctx.roundRect(
              seg.x * CELL + 2,
              seg.y * CELL + 2,
              CELL - 4,
              CELL - 4,
              idx === 0 ? 6 : 4
            );
            ctx.fill();
          });
        }
      }
    }, tickInterval);

    return () => clearInterval(timer);
  }, [gameState, speedMode, onGameOver]);

  return (
    <div className="flex flex-col items-center w-full">
      {/* HUD */}
      <div className="w-full max-w-[700px] bg-slate-900/90 border border-slate-800 rounded-t-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[11px] text-slate-400">Score</div>
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
            <div className="text-[11px] text-slate-400">Chain Multiplier</div>
            <div className="text-sm font-bold font-mono tabular-nums text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              {combo}x Combo · Length {viperLength}
            </div>
          </div>
        </div>

        {gameState === 'PLAYING' && (
          <button
            onClick={() => setGameState('PAUSED')}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
        )}
      </div>

      {/* Viewport */}
      <div className="relative w-full max-w-[700px] aspect-[7/5] bg-[#071118] border-x border-b border-slate-800 rounded-b-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={700} height={500} className="w-full h-full block" />

        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-3xl font-bold font-display text-white">Neon Viper</h2>
            <p className="text-sm text-slate-300 max-w-md mt-2">
              Collect cyan Data Orbs within 4.5 seconds of each other to build a 5x Chain Multiplier. Screen borders act as warp portals.
            </p>
            <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg mt-5">
              {(['STANDARD', 'OVERCLOCK'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSpeedMode(m)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    speedMode === m
                      ? 'bg-emerald-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'STANDARD' ? 'Standard Grid' : 'Overclock Speed'}
                </button>
              ))}
            </div>
            <button
              onClick={startViper}
              className="mt-6 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Game
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-bold font-display text-white">Grid Paused</h3>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setGameState('PLAYING')}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Resume Game
              </button>
              <button
                onClick={startViper}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Restart Game
              </button>
            </div>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-bold font-display text-white">Circuit Collision</h3>
            <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div>
                <div className="text-xs text-slate-400">Final Score</div>
                <div className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-0.5">
                  {score.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Final Length</div>
                <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                  {viperLength} Nodes
                </div>
              </div>
            </div>
            <button
              onClick={startViper}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Directional Pad for Touch / Click */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => changeDirection(-1, 0)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-200 whitespace-nowrap shrink-0"
        >
          Left (←)
        </button>
        <button
          onClick={() => changeDirection(0, -1)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-200 whitespace-nowrap shrink-0"
        >
          Up (↑)
        </button>
        <button
          onClick={() => changeDirection(0, 1)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-200 whitespace-nowrap shrink-0"
        >
          Down (↓)
        </button>
        <button
          onClick={() => changeDirection(1, 0)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-200 whitespace-nowrap shrink-0"
        >
          Right (→)
        </button>
      </div>
    </div>
  );
};
