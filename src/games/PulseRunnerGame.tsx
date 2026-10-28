import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameProps, GameState } from '../types/arcade';
import { soundFX } from '../utils/sound';
import { Play, RotateCcw, Pause, Zap } from 'lucide-react';

interface Obstacle {
  x: number;
  w: number;
  h: number;
  type: 'SPIKE' | 'BARRIER';
  shattered?: boolean;
}

interface Shard {
  x: number;
  y: number;
  collected?: boolean;
}

export const PulseRunnerGame: React.FC<GameProps> = ({
  highScore,
  onGameOver,
}) => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [shardsCount, setShardsCount] = useState(0);
  const [dashReady, setDashReady] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    py: 360,
    vy: 0,
    jumpsRemaining: 2,
    dashActiveTimer: 0,
    dashCooldownTimer: 0,
    speed: 310,
    score: 0,
    shards: 0,
    spawnTimer: 0.8,
    obstacles: [] as Obstacle[],
    dataShards: [] as Shard[],
  });

  const groundY = 390;

  const startRun = useCallback(() => {
    stateRef.current = {
      py: groundY,
      vy: 0,
      jumpsRemaining: 2,
      dashActiveTimer: 0,
      dashCooldownTimer: 0,
      speed: 310,
      score: 0,
      shards: 0,
      spawnTimer: 0.8,
      obstacles: [],
      dataShards: [],
    };
    setScore(0);
    setShardsCount(0);
    setDashReady(true);
    setGameState('PLAYING');
    soundFX.playBoost();
  }, []);

  const triggerJump = useCallback(() => {
    const s = stateRef.current;
    if (gameState === 'PLAYING' && s.jumpsRemaining > 0) {
      s.vy = -520;
      s.jumpsRemaining -= 1;
      soundFX.playJump();
    }
  }, [gameState]);

  const triggerDash = useCallback(() => {
    const s = stateRef.current;
    if (gameState === 'PLAYING' && s.dashCooldownTimer <= 0) {
      s.dashActiveTimer = 0.34;
      s.dashCooldownTimer = 1.1;
      setDashReady(false);
      soundFX.playBoost();
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        triggerJump();
      }
      if (
        e.code === 'ShiftLeft' ||
        e.code === 'ShiftRight' ||
        e.code === 'KeyD' ||
        e.code === 'ArrowRight'
      ) {
        triggerDash();
      }
      if ((e.code === 'KeyP' || e.code === 'Escape') && gameState === 'PLAYING') {
        setGameState('PAUSED');
      } else if ((e.code === 'KeyP' || e.code === 'Escape') && gameState === 'PAUSED') {
        setGameState('PLAYING');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, triggerJump, triggerDash]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const s = stateRef.current;

      // Gravity & Vertical physics
      s.vy += 1350 * dt;
      s.py += s.vy * dt;
      if (s.py >= groundY) {
        s.py = groundY;
        s.vy = 0;
        s.jumpsRemaining = 2;
      }

      // Dash timers
      if (s.dashActiveTimer > 0) s.dashActiveTimer = Math.max(0, s.dashActiveTimer - dt);
      if (s.dashCooldownTimer > 0) {
        s.dashCooldownTimer = Math.max(0, s.dashCooldownTimer - dt);
        if (s.dashCooldownTimer === 0) setDashReady(true);
      }

      // Speed & Distance Score
      s.speed = Math.min(540, s.speed + 7 * dt);
      const effectiveSpeed = s.dashActiveTimer > 0 ? s.speed * 1.45 : s.speed;
      s.score += effectiveSpeed * dt * 0.25;

      // Spawn Obstacles & Shards
      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) {
        const isBarrier = Math.random() < 0.38;
        s.obstacles.push({
          x: 740,
          w: isBarrier ? 22 : 34,
          h: isBarrier ? 115 : 46,
          type: isBarrier ? 'BARRIER' : 'SPIKE',
        });
        s.dataShards.push({
          x: 740 + 130,
          y: groundY - 75 - Math.random() * 65,
        });
        s.spawnTimer = Math.max(0.65, 1.45 - s.speed / 650);
      }

      const playerX = 135;

      // Obstacles collision
      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const ob = s.obstacles[i];
        ob.x -= effectiveSpeed * dt;

        if (!ob.shattered) {
          const overlapX = playerX + 16 > ob.x && playerX - 16 < ob.x + ob.w;
          const overlapY = s.py > groundY - ob.h;
          if (overlapX && overlapY) {
            if (s.dashActiveTimer > 0) {
              ob.shattered = true;
              s.score += 220;
              soundFX.playExplosion();
            } else {
              soundFX.playGameOver();
              setGameState('GAME_OVER');
              onGameOver(Math.floor(s.score), `${s.shards} Data Shards`);
              return;
            }
          }
        }

        if (ob.x < -60) s.obstacles.splice(i, 1);
      }

      // Data Shards collection
      for (let i = s.dataShards.length - 1; i >= 0; i--) {
        const sh = s.dataShards[i];
        sh.x -= effectiveSpeed * dt;
        if (!sh.collected && Math.hypot(sh.x - playerX, sh.y - (s.py - 20)) < 32) {
          sh.collected = true;
          s.shards += 1;
          s.score += 150;
          setShardsCount(s.shards);
          soundFX.playPickup();
        }
        if (sh.x < -30 || sh.collected) s.dataShards.splice(i, 1);
      }

      setScore(Math.floor(s.score));

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0A0D1C';
          ctx.fillRect(0, 0, 700, 500);

          // Skyline Rooftop Deck
          ctx.fillStyle = '#111827';
          ctx.fillRect(0, groundY, 700, 500 - groundY);
          ctx.strokeStyle = '#22D3EE';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, groundY);
          ctx.lineTo(700, groundY);
          ctx.stroke();

          // Data Shards
          s.dataShards.forEach((sh) => {
            ctx.fillStyle = '#22D3EE';
            ctx.beginPath();
            ctx.arc(sh.x, sh.y, 9, 0, Math.PI * 2);
            ctx.fill();
          });

          // Obstacles
          s.obstacles.forEach((ob) => {
            if (ob.shattered) return;
            ctx.fillStyle = ob.type === 'BARRIER' ? '#EC4899' : '#F59E0B';
            ctx.beginPath();
            ctx.roundRect(ob.x, groundY - ob.h, ob.w, ob.h, 4);
            ctx.fill();
          });

          // Player Runner
          ctx.save();
          ctx.translate(playerX, s.py);
          if (s.dashActiveTimer > 0) {
            ctx.fillStyle = 'rgba(34, 211, 238, 0.35)';
            ctx.fillRect(-48, -42, 45, 38);
          }
          ctx.fillStyle = s.dashActiveTimer > 0 ? '#22D3EE' : '#F8FAFC';
          ctx.beginPath();
          ctx.roundRect(-16, -42, 32, 42, 6);
          ctx.fill();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, onGameOver]);

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
            <div className="text-[11px] text-slate-400">Data Shards</div>
            <div className="text-lg font-bold font-mono tabular-nums text-amber-400">
              {shardsCount}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Phase Dash</div>
            <div
              className={`text-xs font-mono tabular-nums flex items-center gap-1 ${
                dashReady ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {dashReady ? 'READY (Shift / D)' : 'RECHARGING'}
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
      <div className="relative w-full max-w-[700px] aspect-[7/5] bg-[#0A0D1C] border-x border-b border-slate-800 rounded-b-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={700} height={500} className="w-full h-full block" />

        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-3xl font-bold font-display text-white">Pulse Runner</h2>
            <p className="text-sm text-slate-300 max-w-md mt-2">
              Jump and Double-Jump over golden spikes with Space / W / Up. Smash straight through tall pink laser barriers using your Phase Dash (Shift / D / Right).
            </p>
            <button
              onClick={startRun}
              className="mt-6 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Game
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-bold font-display text-white">Run Paused</h3>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setGameState('PLAYING')}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Resume Game
              </button>
              <button
                onClick={startRun}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Restart Game
              </button>
            </div>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-bold font-display text-white">Run Terminated</h3>
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
              onClick={startRun}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Touch Action Buttons */}
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={triggerJump}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-cyan-300 whitespace-nowrap shrink-0"
        >
          Jump / Double-Jump (Space)
        </button>
        <button
          onClick={triggerDash}
          className="px-5 py-2.5 bg-pink-950/70 hover:bg-pink-900/80 border border-pink-500/40 rounded-lg text-xs font-semibold text-pink-300 whitespace-nowrap shrink-0"
        >
          Phase Dash Smash (Shift / D)
        </button>
      </div>
    </div>
  );
};
