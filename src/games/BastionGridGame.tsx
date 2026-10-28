import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameProps, GameState } from '../types/arcade';
import { soundFX } from '../utils/sound';
import { Play, RotateCcw, Pause, Shield, Cpu, Wrench } from 'lucide-react';

interface Turret {
  x: number;
  y: number;
  type: 'LASER' | 'CRYO';
  cooldown: number;
}

interface Drone {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  slowTimer: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

export const BastionGridGame: React.FC<GameProps> = ({
  highScore,
  onGameOver,
}) => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [scrap, setScrap] = useState(120);
  const [coreHp, setCoreHp] = useState(100);
  const [wave, setWave] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const stateRef = useRef({
    tankX: 250,
    tankY: 250,
    aimX: 450,
    aimY: 250,
    score: 0,
    scrap: 120,
    coreHp: 100,
    wave: 1,
    killsInWave: 0,
    spawnTimer: 0,
    tankFireTimer: 0,
    turrets: [] as Turret[],
    drones: [] as Drone[],
    projectiles: [] as Projectile[],
  });

  const startDefense = useCallback(() => {
    stateRef.current = {
      tankX: 240,
      tankY: 250,
      aimX: 480,
      aimY: 250,
      score: 0,
      scrap: 120,
      coreHp: 100,
      wave: 1,
      killsInWave: 0,
      spawnTimer: 0.5,
      tankFireTimer: 0,
      turrets: [],
      drones: [],
      projectiles: [],
    };
    setScore(0);
    setScrap(120);
    setCoreHp(100);
    setWave(1);
    setGameState('PLAYING');
    soundFX.playBoost();
  }, []);

  const deployAction = useCallback(
    (actionType: 'LASER' | 'CRYO' | 'REPAIR') => {
      if (gameState !== 'PLAYING') return;
      const s = stateRef.current;
      if (actionType === 'LASER' && s.scrap >= 50) {
        s.scrap -= 50;
        s.turrets.push({
          x: s.tankX,
          y: s.tankY,
          type: 'LASER',
          cooldown: 0,
        });
        soundFX.playPickup();
      } else if (actionType === 'CRYO' && s.scrap >= 65) {
        s.scrap -= 65;
        s.turrets.push({
          x: s.tankX,
          y: s.tankY,
          type: 'CRYO',
          cooldown: 0,
        });
        soundFX.playPickup();
      } else if (actionType === 'REPAIR' && s.scrap >= 40 && s.coreHp < 100) {
        s.scrap -= 40;
        s.coreHp = Math.min(100, s.coreHp + 25);
        setCoreHp(s.coreHp);
        soundFX.playMerge();
      }
      setScrap(s.scrap);
    },
    [gameState]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current[e.code] = true;
      if (e.code === 'Digit1') deployAction('LASER');
      if (e.code === 'Digit2') deployAction('CRYO');
      if (e.code === 'Digit3') deployAction('REPAIR');
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
  }, [gameState, deployAction]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const s = stateRef.current;
      const keys = keysRef.current;

      // Tank movement
      const speed = 210;
      if (keys['KeyA'] || keys['ArrowLeft']) s.tankX = Math.max(40, s.tankX - speed * dt);
      if (keys['KeyD'] || keys['ArrowRight']) s.tankX = Math.min(660, s.tankX + speed * dt);
      if (keys['KeyW'] || keys['ArrowUp']) s.tankY = Math.max(40, s.tankY - speed * dt);
      if (keys['KeyS'] || keys['ArrowDown']) s.tankY = Math.min(460, s.tankY + speed * dt);

      // Tank railgun auto-fire
      s.tankFireTimer -= dt;
      if (s.tankFireTimer <= 0) {
        s.tankFireTimer = 0.26;
        const angle = Math.atan2(s.aimY - s.tankY, s.aimX - s.tankX);
        s.projectiles.push({
          x: s.tankX,
          y: s.tankY,
          vx: Math.cos(angle) * 460,
          vy: Math.sin(angle) * 460,
          color: '#F59E0B',
        });
        soundFX.playLaser();
      }

      // Turret logic
      s.turrets.forEach((t) => {
        t.cooldown -= dt;
        if (t.cooldown <= 0 && s.drones.length > 0) {
          // Find nearest drone
          let nearest: Drone | null = null;
          let minDist = 240;
          s.drones.forEach((d) => {
            const dist = Math.hypot(d.x - t.x, d.y - t.y);
            if (dist < minDist) {
              minDist = dist;
              nearest = d;
            }
          });
          if (nearest) {
            const target = nearest as Drone;
            t.cooldown = t.type === 'LASER' ? 0.55 : 0.9;
            const ang = Math.atan2(target.y - t.y, target.x - t.x);
            s.projectiles.push({
              x: t.x,
              y: t.y,
              vx: Math.cos(ang) * 390,
              vy: Math.sin(ang) * 390,
              color: t.type === 'LASER' ? '#22D3EE' : '#38BDF8',
            });
            if (t.type === 'CRYO') {
              target.slowTimer = 2.5;
            }
          }
        }
      });

      // Spawn Drones around perimeter
      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) {
        const edge = Math.floor(Math.random() * 4);
        let x = 0;
        let y = 0;
        if (edge === 0) {
          x = Math.random() * 700;
          y = -20;
        } else if (edge === 1) {
          x = 720;
          y = Math.random() * 500;
        } else if (edge === 2) {
          x = Math.random() * 700;
          y = 520;
        } else {
          x = -20;
          y = Math.random() * 500;
        }
        const hp = 3 + Math.floor(s.wave * 0.8);
        s.drones.push({
          x,
          y,
          hp,
          maxHp: hp,
          speed: 52 + s.wave * 4,
          slowTimer: 0,
        });
        s.spawnTimer = Math.max(0.55, 1.6 - s.wave * 0.08);
      }

      // Projectiles update
      for (let i = s.projectiles.length - 1; i >= 0; i--) {
        const p = s.projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0 || p.x > 700 || p.y < 0 || p.y > 500) {
          s.projectiles.splice(i, 1);
        }
      }

      // Drones update & Core collision
      for (let i = s.drones.length - 1; i >= 0; i--) {
        const d = s.drones[i];
        if (d.slowTimer > 0) d.slowTimer -= dt;
        const moveSpd = d.slowTimer > 0 ? d.speed * 0.45 : d.speed;
        const ang = Math.atan2(250 - d.y, 350 - d.x);
        d.x += Math.cos(ang) * moveSpd * dt;
        d.y += Math.sin(ang) * moveSpd * dt;

        // Check projectile hits
        for (let pi = s.projectiles.length - 1; pi >= 0; pi--) {
          const p = s.projectiles[pi];
          if (Math.hypot(p.x - d.x, p.y - d.y) < 20) {
            d.hp -= 1;
            s.projectiles.splice(pi, 1);
            if (d.hp <= 0) break;
          }
        }

        if (d.hp <= 0) {
          soundFX.playExplosion();
          s.score += 120;
          s.scrap += 18;
          s.killsInWave += 1;
          if (s.killsInWave % 10 === 0) {
            s.wave += 1;
            setWave(s.wave);
          }
          setScore(s.score);
          setScrap(s.scrap);
          s.drones.splice(i, 1);
          continue;
        }

        // Core breach check
        if (Math.hypot(d.x - 350, d.y - 250) < 38) {
          s.coreHp = Math.max(0, s.coreHp - 20);
          setCoreHp(s.coreHp);
          soundFX.playHit();
          s.drones.splice(i, 1);
          if (s.coreHp <= 0) {
            soundFX.playGameOver();
            setGameState('GAME_OVER');
            onGameOver(s.score, `Wave ${s.wave} · ${s.turrets.length} Turrets`);
            return;
          }
        }
      }

      // Draw
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#090F1B';
          ctx.fillRect(0, 0, 700, 500);

          // Tactical Grid
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 1;
          for (let gx = 0; gx < 700; gx += 50) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, 500);
            ctx.stroke();
          }
          for (let gy = 0; gy < 500; gy += 50) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(700, gy);
            ctx.stroke();
          }

          // Central Nexus Core
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(350, 250, 34, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#22D3EE';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`CORE ${s.coreHp}%`, 350, 254);

          // Turrets
          s.turrets.forEach((t) => {
            ctx.fillStyle = '#1E293B';
            ctx.strokeStyle = t.type === 'LASER' ? '#22D3EE' : '#38BDF8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });

          // Drones
          s.drones.forEach((d) => {
            ctx.fillStyle = d.slowTimer > 0 ? '#0284C7' : '#831843';
            ctx.strokeStyle = '#EC4899';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(d.x, d.y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });

          // Projectiles
          s.projectiles.forEach((p) => {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
          });

          // Player Hover-Tank
          ctx.save();
          ctx.translate(s.tankX, s.tankY);
          ctx.fillStyle = '#1E293B';
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(-18, -18, 36, 36, 6);
          ctx.fill();
          ctx.stroke();

          const aimAngle = Math.atan2(s.aimY - s.tankY, s.aimX - s.tankX);
          ctx.rotate(aimAngle);
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(24, 0);
          ctx.stroke();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, onGameOver]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    stateRef.current.aimX = ((e.clientX - rect.left) / rect.width) * 700;
    stateRef.current.aimY = ((e.clientY - rect.top) / rect.height) * 500;
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
            <div className="text-[11px] text-slate-400">Scrap Energy</div>
            <div className="text-lg font-bold font-mono tabular-nums text-amber-400">
              {scrap} SCRAP
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Assault Wave</div>
            <div className="text-sm font-bold font-mono tabular-nums text-pink-400">
              Wave {wave}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`text-xs font-mono tabular-nums flex items-center gap-1 ${
              coreHp > 40 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Core HP: {coreHp}% · {coreHp > 40 ? 'FORTIFIED' : 'BREACH WARNING'}
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
      </div>

      {/* Viewport */}
      <div className="relative w-full max-w-[700px] aspect-[7/5] bg-[#090F1B] border-x border-b border-slate-800 overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={700}
          height={500}
          onMouseMove={handleMouseMove}
          className="w-full h-full block cursor-crosshair"
        />

        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-3xl font-bold font-display text-white">Bastion Grid</h2>
            <p className="text-sm text-slate-300 max-w-md mt-2">
              Drive your hover-tank with WASD and aim with the cursor. Harvest Scrap Energy from destroyed perimeter drones to build automated Laser and Cryo turrets around the central Nexus Core.
            </p>
            <button
              onClick={startDefense}
              className="mt-6 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Game
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-bold font-display text-white">Defense Paused</h3>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setGameState('PLAYING')}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Resume Game
              </button>
              <button
                onClick={startDefense}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Restart Game
              </button>
            </div>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-bold font-display text-white">Nexus Core Breached</h3>
            <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div>
                <div className="text-xs text-slate-400">Final Score</div>
                <div className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-0.5">
                  {score.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Best Record</div>
                <div className="text-xl font-bold font-mono tabular-nums text-amber-400 mt-0.5">
                  {Math.max(score, highScore).toLocaleString()}
                </div>
              </div>
            </div>
            <button
              onClick={startDefense}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Tactical Deployment Action Bar */}
      <div className="w-full max-w-[700px] bg-slate-900 border-x border-b border-slate-800 rounded-b-xl p-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-400">
          Deploy at Tank Position:
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => deployAction('LASER')}
            disabled={scrap < 50 || gameState !== 'PLAYING'}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-cyan-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Cpu className="w-3.5 h-3.5" />
            [1] Laser Turret (50 Scrap)
          </button>
          <button
            onClick={() => deployAction('CRYO')}
            disabled={scrap < 65 || gameState !== 'PLAYING'}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-sky-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Cpu className="w-3.5 h-3.5" />
            [2] Cryo Tower (65 Scrap)
          </button>
          <button
            onClick={() => deployAction('REPAIR')}
            disabled={scrap < 40 || coreHp >= 100 || gameState !== 'PLAYING'}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Wrench className="w-3.5 h-3.5" />
            [3] Repair Core (40 Scrap)
          </button>
        </div>
      </div>
    </div>
  );
};
