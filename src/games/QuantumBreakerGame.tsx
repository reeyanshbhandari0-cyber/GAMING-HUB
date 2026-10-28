import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameProps, GameState } from '../types/arcade';
import { soundFX } from '../utils/sound';
import { Play, RotateCcw, Pause, Disc } from 'lucide-react';

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  color: string;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Capsule {
  x: number;
  y: number;
  type: 'MULTIBALL' | 'WIDE';
}

export const QuantumBreakerGame: React.FC<GameProps> = ({
  highScore,
  onGameOver,
}) => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [cabinetMode, setCabinetMode] = useState<'BREAKOUT' | 'PONG_ARENA'>('BREAKOUT');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [aiScore, setAiScore] = useState(0);
  const [playerGoals, setPlayerGoals] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const stateRef = useRef({
    paddleX: 290,
    paddleW: 120,
    aiPaddleX: 290,
    balls: [] as Ball[],
    bricks: [] as Brick[],
    capsules: [] as Capsule[],
    score: 0,
    lives: 3,
    playerGoals: 0,
    aiGoals: 0,
  });

  const generateBricks = (): Brick[] => {
    const colors = ['#06B6D4', '#EC4899', '#F59E0B', '#10B981', '#38BDF8'];
    const list: Brick[] = [];
    const cols = 8;
    const rows = 5;
    const bw = 72;
    const bh = 22;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        list.push({
          x: 42 + c * (bw + 8),
          y: 52 + r * (bh + 8),
          w: bw,
          h: bh,
          hp: r < 2 ? 2 : 1,
          color: colors[r % colors.length],
        });
      }
    }
    return list;
  };

  const startCabinet = useCallback(() => {
    stateRef.current = {
      paddleX: 290,
      paddleW: 120,
      aiPaddleX: 290,
      balls: [{ x: 350, y: 390, vx: 210, vy: -290 }],
      bricks: cabinetMode === 'BREAKOUT' ? generateBricks() : [],
      capsules: [],
      score: 0,
      lives: 3,
      playerGoals: 0,
      aiGoals: 0,
    };
    setScore(0);
    setLives(3);
    setPlayerGoals(0);
    setAiScore(0);
    setGameState('PLAYING');
    soundFX.playBoost();
  }, [cabinetMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current[e.code] = true;
      if ((e.code === 'KeyP' || e.code === 'Escape') && gameState === 'PLAYING') {
        setGameState('PAUSED');
      } else if ((e.code === 'KeyP' || e.code === 'Escape') && gameState === 'PAUSED') {
        setGameState('PLAYING');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;
      const s = stateRef.current;
      const keys = keysRef.current;

      // Paddle movement
      const speed = 440;
      if (keys['ArrowLeft'] || keys['KeyA']) {
        s.paddleX = Math.max(16, s.paddleX - speed * dt);
      }
      if (keys['ArrowRight'] || keys['KeyD']) {
        s.paddleX = Math.min(684 - s.paddleW, s.paddleX + speed * dt);
      }

      // Pong AI Paddle
      if (cabinetMode === 'PONG_ARENA' && s.balls[0]) {
        const targetX = s.balls[0].x - 55;
        const diff = targetX - s.aiPaddleX;
        s.aiPaddleX += Math.sign(diff) * Math.min(Math.abs(diff), 295 * dt);
        s.aiPaddleX = Math.max(16, Math.min(574, s.aiPaddleX));
      }

      // Balls update
      for (let i = s.balls.length - 1; i >= 0; i--) {
        const b = s.balls[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Side walls
        if (b.x < 12) {
          b.x = 12;
          b.vx = Math.abs(b.vx);
          soundFX.playBounce();
        }
        if (b.x > 688) {
          b.x = 688;
          b.vx = -Math.abs(b.vx);
          soundFX.playBounce();
        }

        // Top wall or Pong AI goal
        if (cabinetMode === 'BREAKOUT') {
          if (b.y < 14) {
            b.y = 14;
            b.vy = Math.abs(b.vy);
            soundFX.playBounce();
          }
        } else {
          // Check AI Paddle at y = 36
          if (
            b.vy < 0 &&
            b.y <= 52 &&
            b.y >= 30 &&
            b.x >= s.aiPaddleX &&
            b.x <= s.aiPaddleX + 110
          ) {
            b.vy = Math.abs(b.vy) * 1.04;
            const offset = (b.x - (s.aiPaddleX + 55)) / 55;
            b.vx += offset * 140;
            soundFX.playBounce();
          } else if (b.y < 0) {
            // Player scored goal in Pong Arena!
            soundFX.playPickup();
            s.playerGoals += 1;
            s.score += 450;
            setPlayerGoals(s.playerGoals);
            setScore(s.score);
            if (s.playerGoals >= 5) {
              s.score += 1000;
              setScore(s.score);
              setGameState('GAME_OVER');
              onGameOver(s.score, `Pong Victory ${s.playerGoals}-${s.aiGoals}`);
              return;
            }
            b.x = 350;
            b.y = 250;
            b.vx = (Math.random() > 0.5 ? 1 : -1) * 210;
            b.vy = 280;
          }
        }

        // Player Paddle collision at y = 450
        if (
          b.vy > 0 &&
          b.y >= 442 &&
          b.y <= 466 &&
          b.x >= s.paddleX - 8 &&
          b.x <= s.paddleX + s.paddleW + 8
        ) {
          b.vy = -Math.abs(b.vy) * 1.02;
          const hitFactor = (b.x - (s.paddleX + s.paddleW / 2)) / (s.paddleW / 2);
          b.vx = hitFactor * 330;
          soundFX.playBounce();
          if (cabinetMode === 'PONG_ARENA') {
            s.score += 50;
            setScore(s.score);
          }
        }

        // Brick collisions
        if (cabinetMode === 'BREAKOUT') {
          for (let bi = s.bricks.length - 1; bi >= 0; bi--) {
            const br = s.bricks[bi];
            if (
              b.x >= br.x - 6 &&
              b.x <= br.x + br.w + 6 &&
              b.y >= br.y - 6 &&
              b.y <= br.y + br.h + 6
            ) {
              b.vy *= -1;
              br.hp -= 1;
              soundFX.playBounce();
              if (br.hp <= 0) {
                s.score += 110;
                setScore(s.score);
                if (Math.random() < 0.18) {
                  s.capsules.push({
                    x: br.x + br.w / 2,
                    y: br.y,
                    type: Math.random() < 0.5 ? 'MULTIBALL' : 'WIDE',
                  });
                }
                s.bricks.splice(bi, 1);
              }
              break;
            }
          }

          if (s.bricks.length === 0) {
            soundFX.playAchievement();
            s.score += 800;
            setScore(s.score);
            s.bricks = generateBricks();
          }
        }

        // Bottom out of bounds
        if (b.y > 505) {
          s.balls.splice(i, 1);
          if (s.balls.length === 0) {
            if (cabinetMode === 'PONG_ARENA') {
              s.aiGoals += 1;
              setAiScore(s.aiGoals);
              soundFX.playHit();
              if (s.aiGoals >= 5) {
                soundFX.playGameOver();
                setGameState('GAME_OVER');
                onGameOver(s.score, `Pong Match ${s.playerGoals}-${s.aiGoals}`);
                return;
              }
              s.balls.push({ x: 350, y: 250, vx: 200, vy: -280 });
            } else {
              s.lives -= 1;
              setLives(s.lives);
              soundFX.playHit();
              if (s.lives <= 0) {
                soundFX.playGameOver();
                setGameState('GAME_OVER');
                onGameOver(s.score, 'Breakout Complete');
                return;
              }
              s.balls.push({ x: s.paddleX + s.paddleW / 2, y: 420, vx: 210, vy: -290 });
            }
          }
        }
      }

      // Capsules update
      for (let ci = s.capsules.length - 1; ci >= 0; ci--) {
        const cap = s.capsules[ci];
        cap.y += 130 * dt;
        if (
          cap.y >= 440 &&
          cap.y <= 470 &&
          cap.x >= s.paddleX &&
          cap.x <= s.paddleX + s.paddleW
        ) {
          soundFX.playPickup();
          if (cap.type === 'WIDE') {
            s.paddleW = Math.min(180, s.paddleW + 30);
          } else if (s.balls[0]) {
            s.balls.push({
              x: s.balls[0].x,
              y: s.balls[0].y,
              vx: -s.balls[0].vx,
              vy: -Math.abs(s.balls[0].vy),
            });
          }
          s.score += 180;
          setScore(s.score);
          s.capsules.splice(ci, 1);
          continue;
        }
        if (cap.y > 510) s.capsules.splice(ci, 1);
      }

      // Draw
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#090D1A';
          ctx.fillRect(0, 0, 700, 500);

          if (cabinetMode === 'PONG_ARENA') {
            // Center Court Line
            ctx.strokeStyle = '#1E293B';
            ctx.setLineDash([12, 12]);
            ctx.beginPath();
            ctx.moveTo(0, 250);
            ctx.lineTo(700, 250);
            ctx.stroke();
            ctx.setLineDash([]);

            // AI Paddle
            ctx.fillStyle = '#EC4899';
            ctx.beginPath();
            ctx.roundRect(s.aiPaddleX, 34, 110, 14, 7);
            ctx.fill();
          } else {
            // Bricks
            s.bricks.forEach((br) => {
              ctx.fillStyle = br.color;
              ctx.beginPath();
              ctx.roundRect(br.x, br.y, br.w, br.h, 4);
              ctx.fill();
              if (br.hp > 1) {
                ctx.strokeStyle = '#F8FAFC';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }
            });

            // Capsules
            s.capsules.forEach((cap) => {
              ctx.fillStyle = cap.type === 'MULTIBALL' ? '#F59E0B' : '#10B981';
              ctx.beginPath();
              ctx.roundRect(cap.x - 18, cap.y - 8, 36, 16, 8);
              ctx.fill();
            });
          }

          // Player Paddle
          ctx.fillStyle = '#22D3EE';
          ctx.beginPath();
          ctx.roundRect(s.paddleX, 450, s.paddleW, 14, 7);
          ctx.fill();

          // Quantum Spheres
          s.balls.forEach((b) => {
            ctx.fillStyle = '#F8FAFC';
            ctx.beginPath();
            ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, cabinetMode, onGameOver]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 700;
    stateRef.current.paddleX = Math.max(
      16,
      Math.min(684 - stateRef.current.paddleW, x - stateRef.current.paddleW / 2)
    );
  };

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
            <div className="text-[11px] text-slate-400">
              {cabinetMode === 'BREAKOUT' ? 'Spheres Remaining' : 'Match Score (First to 5)'}
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-200 flex items-center gap-1">
              <Disc className="w-3.5 h-3.5 text-cyan-400" />
              {cabinetMode === 'BREAKOUT'
                ? `${lives} Spheres`
                : `You ${playerGoals} · AI ${aiScore}`}
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
      <div className="relative w-full max-w-[700px] aspect-[7/5] bg-[#090D1A] border-x border-b border-slate-800 rounded-b-xl overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={700}
          height={500}
          onMouseMove={handleMouseMove}
          className="w-full h-full block"
        />

        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-3xl font-bold font-display text-white">Quantum Breaker</h2>
            <p className="text-sm text-slate-300 max-w-md mt-2">
              Control your deflector paddle with the mouse or A/D/Arrow keys. Select either Cyber Brick Breaker with power-up capsules or 1v1 AI Pong Arena.
            </p>
            <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg mt-5">
              <button
                onClick={() => setCabinetMode('BREAKOUT')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  cabinetMode === 'BREAKOUT'
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Brick Breaker Mode
              </button>
              <button
                onClick={() => setCabinetMode('PONG_ARENA')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  cabinetMode === 'PONG_ARENA'
                    ? 'bg-pink-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cyber Pong vs AI
              </button>
            </div>
            <button
              onClick={startCabinet}
              className="mt-6 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Game
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-bold font-display text-white">Match Paused</h3>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setGameState('PLAYING')}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Resume Game
              </button>
              <button
                onClick={startCabinet}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Restart Game
              </button>
            </div>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-bold font-display text-white">Session Complete</h3>
            <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div>
                <div className="text-xs text-slate-400">Final Score</div>
                <div className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-0.5">
                  {score.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Personal Best</div>
                <div className="text-xl font-bold font-mono tabular-nums text-amber-400 mt-0.5">
                  {Math.max(score, highScore).toLocaleString()}
                </div>
              </div>
            </div>
            <button
              onClick={startCabinet}
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
