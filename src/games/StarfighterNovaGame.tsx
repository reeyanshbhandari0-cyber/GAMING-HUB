import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameProps, GameState } from '../types/arcade';
import { soundFX } from '../utils/sound';
import { Play, RotateCcw, Pause, Shield, Crosshair, Flame } from 'lucide-react';

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isEnemy?: boolean;
}

interface EnemyShip {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  isBoss?: boolean;
  shootCooldown: number;
}

interface PowerUpPod {
  x: number;
  y: number;
  type: 'SPREAD' | 'SHIELD' | 'BOMB';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export const StarfighterNovaGame: React.FC<GameProps> = ({
  highScore,
  onGameOver,
}) => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [hullHp, setHullHp] = useState(100);
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [empBombs, setEmpBombs] = useState(2);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const stateRef = useRef({
    px: 350,
    py: 430,
    score: 0,
    wave: 1,
    hull: 100,
    weaponTier: 1,
    bombs: 2,
    fireTimer: 0,
    spawnTimer: 0,
    enemiesSpawnedInWave: 0,
    bullets: [] as Bullet[],
    enemies: [] as EnemyShip[],
    powerups: [] as PowerUpPod[],
    particles: [] as Particle[],
    stars: Array.from({ length: 45 }, () => ({
      x: Math.random() * 700,
      y: Math.random() * 500,
      speed: 35 + Math.random() * 85,
    })),
  });

  const startMission = useCallback(() => {
    stateRef.current = {
      ...stateRef.current,
      px: 350,
      py: 430,
      score: 0,
      wave: 1,
      hull: 100,
      weaponTier: 1,
      bombs: 2,
      fireTimer: 0,
      spawnTimer: 0.4,
      enemiesSpawnedInWave: 0,
      bullets: [],
      enemies: [],
      powerups: [],
      particles: [],
    };
    setScore(0);
    setWave(1);
    setHullHp(100);
    setWeaponLevel(1);
    setEmpBombs(2);
    setGameState('PLAYING');
    soundFX.playBoost();
  }, []);

  const triggerEmpBomb = useCallback(() => {
    const s = stateRef.current;
    if (s.bombs <= 0 || gameState !== 'PLAYING') return;
    s.bombs -= 1;
    setEmpBombs(s.bombs);
    soundFX.playExplosion();

    // Clear enemy projectiles & damage all ships
    s.bullets = s.bullets.filter((b) => !b.isEnemy);
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const e = s.enemies[i];
      e.hp -= 12;
      for (let p = 0; p < 10; p++) {
        s.particles.push({
          x: e.x,
          y: e.y,
          vx: (Math.random() - 0.5) * 260,
          vy: (Math.random() - 0.5) * 260,
          life: 0.5,
          color: '#22D3EE',
        });
      }
      if (e.hp <= 0) {
        s.score += e.isBoss ? 1200 : 180;
        s.enemies.splice(i, 1);
      }
    }
    setScore(s.score);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current[e.code] = true;
      if (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        triggerEmpBomb();
      }
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
  }, [gameState, triggerEmpBomb]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const s = stateRef.current;
      const keys = keysRef.current;

      // Move Player
      const moveSpeed = 310;
      if (keys['ArrowLeft'] || keys['KeyA']) s.px = Math.max(35, s.px - moveSpeed * dt);
      if (keys['ArrowRight'] || keys['KeyD']) s.px = Math.min(665, s.px + moveSpeed * dt);
      if (keys['ArrowUp'] || keys['KeyW']) s.py = Math.max(80, s.py - moveSpeed * dt);
      if (keys['ArrowDown'] || keys['KeyS']) s.py = Math.min(460, s.py + moveSpeed * dt);

      // Auto or Space Firing
      s.fireTimer -= dt;
      if (s.fireTimer <= 0) {
        s.fireTimer = 0.16;
        soundFX.playLaser();
        if (s.weaponTier === 1) {
          s.bullets.push({ x: s.px - 10, y: s.py - 18, vx: 0, vy: -520 });
          s.bullets.push({ x: s.px + 10, y: s.py - 18, vx: 0, vy: -520 });
        } else if (s.weaponTier === 2) {
          s.bullets.push({ x: s.px, y: s.py - 22, vx: 0, vy: -540 });
          s.bullets.push({ x: s.px - 14, y: s.py - 14, vx: -95, vy: -510 });
          s.bullets.push({ x: s.px + 14, y: s.py - 14, vx: 95, vy: -510 });
        } else {
          s.bullets.push({ x: s.px - 8, y: s.py - 22, vx: 0, vy: -560 });
          s.bullets.push({ x: s.px + 8, y: s.py - 22, vx: 0, vy: -560 });
          s.bullets.push({ x: s.px - 18, y: s.py - 12, vx: -130, vy: -520 });
          s.bullets.push({ x: s.px + 18, y: s.py - 12, vx: 130, vy: -520 });
        }
      }

      // Spawn Enemies
      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) {
        s.enemiesSpawnedInWave += 1;
        const isBoss = s.enemiesSpawnedInWave % 10 === 0;
        const hp = isBoss ? 14 + s.wave * 4 : 2 + Math.floor(s.wave * 0.6);
        s.enemies.push({
          x: 70 + Math.random() * 560,
          y: -40,
          vx: (Math.random() - 0.5) * 110,
          vy: isBoss ? 38 : 75 + s.wave * 8,
          hp,
          maxHp: hp,
          isBoss,
          shootCooldown: 0.9 + Math.random() * 1.1,
        });
        if (s.enemiesSpawnedInWave % 10 === 0) {
          s.wave += 1;
          setWave(s.wave);
        }
        s.spawnTimer = Math.max(0.45, 1.25 - s.wave * 0.06);
      }

      // Update Bullets
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y < -30 || b.y > 530 || b.x < -20 || b.x > 720) {
          s.bullets.splice(i, 1);
          continue;
        }

        if (b.isEnemy) {
          if (Math.hypot(b.x - s.px, b.y - s.py) < 20) {
            s.hull = Math.max(0, s.hull - 16);
            setHullHp(s.hull);
            soundFX.playHit();
            s.bullets.splice(i, 1);
            if (s.hull <= 0) {
              soundFX.playGameOver();
              setGameState('GAME_OVER');
              onGameOver(s.score, `Wave ${s.wave}`);
              return;
            }
          }
        }
      }

      // Update Enemies
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const e = s.enemies[i];
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (e.x < 45 || e.x > 655) e.vx *= -1;

        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = e.isBoss ? 0.85 : 1.7;
          const angle = Math.atan2(s.py - e.y, s.px - e.x);
          s.bullets.push({
            x: e.x,
            y: e.y + 18,
            vx: Math.cos(angle) * 230,
            vy: Math.sin(angle) * 230,
            isEnemy: true,
          });
        }

        // Check player bullets hitting enemy
        const hitRadius = e.isBoss ? 36 : 22;
        for (let bi = s.bullets.length - 1; bi >= 0; bi--) {
          const b = s.bullets[bi];
          if (!b.isEnemy && Math.hypot(b.x - e.x, b.y - e.y) < hitRadius) {
            e.hp -= 1;
            s.bullets.splice(bi, 1);
            if (e.hp <= 0) break;
          }
        }

        if (e.hp <= 0) {
          soundFX.playExplosion();
          s.score += e.isBoss ? 1000 : 150;
          setScore(s.score);
          for (let p = 0; p < (e.isBoss ? 18 : 8); p++) {
            s.particles.push({
              x: e.x,
              y: e.y,
              vx: (Math.random() - 0.5) * 240,
              vy: (Math.random() - 0.5) * 240,
              life: 0.45,
              color: e.isBoss ? '#F59E0B' : '#EC4899',
            });
          }
          if (Math.random() < (e.isBoss ? 0.9 : 0.22)) {
            const types: ('SPREAD' | 'SHIELD' | 'BOMB')[] = ['SPREAD', 'SHIELD', 'BOMB'];
            s.powerups.push({
              x: e.x,
              y: e.y,
              type: types[Math.floor(Math.random() * types.length)],
            });
          }
          s.enemies.splice(i, 1);
          continue;
        }

        // Collide with player ship
        if (Math.hypot(e.x - s.px, e.y - s.py) < hitRadius + 14) {
          s.hull = Math.max(0, s.hull - 28);
          setHullHp(s.hull);
          soundFX.playExplosion();
          s.enemies.splice(i, 1);
          if (s.hull <= 0) {
            soundFX.playGameOver();
            setGameState('GAME_OVER');
            onGameOver(s.score, `Wave ${s.wave}`);
            return;
          }
          continue;
        }

        if (e.y > 540) {
          s.enemies.splice(i, 1);
        }
      }

      // Powerups
      for (let i = s.powerups.length - 1; i >= 0; i--) {
        const pod = s.powerups[i];
        pod.y += 95 * dt;
        if (Math.hypot(pod.x - s.px, pod.y - s.py) < 28) {
          soundFX.playPickup();
          if (pod.type === 'SPREAD') {
            s.weaponTier = Math.min(3, s.weaponTier + 1);
            setWeaponLevel(s.weaponTier);
          } else if (pod.type === 'SHIELD') {
            s.hull = Math.min(100, s.hull + 30);
            setHullHp(s.hull);
          } else {
            s.bombs = Math.min(5, s.bombs + 1);
            setEmpBombs(s.bombs);
          }
          s.score += 250;
          setScore(s.score);
          s.powerups.splice(i, 1);
          continue;
        }
        if (pod.y > 530) s.powerups.splice(i, 1);
      }

      // Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) s.particles.splice(i, 1);
      }

      // Render
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#060913';
          ctx.fillRect(0, 0, 700, 500);

          // Stars
          ctx.fillStyle = '#94A3B8';
          s.stars.forEach((st) => {
            st.y = (st.y + st.speed * dt) % 500;
            ctx.fillRect(st.x, st.y, 2, 2);
          });

          // Powerup Pods
          s.powerups.forEach((pod) => {
            ctx.fillStyle =
              pod.type === 'SPREAD' ? '#06B6D4' : pod.type === 'SHIELD' ? '#10B981' : '#F59E0B';
            ctx.beginPath();
            ctx.arc(pod.x, pod.y, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#020617';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(pod.type[0], pod.x, pod.y + 3.5);
          });

          // Bullets
          s.bullets.forEach((b) => {
            ctx.fillStyle = b.isEnemy ? '#FB7185' : '#22D3EE';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.isEnemy ? 4.5 : 3.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Enemies
          s.enemies.forEach((e) => {
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.fillStyle = e.isBoss ? '#31102F' : '#1E293B';
            ctx.strokeStyle = e.isBoss ? '#F59E0B' : '#EC4899';
            ctx.lineWidth = 2.5;
            const r = e.isBoss ? 32 : 18;
            ctx.beginPath();
            ctx.moveTo(0, r);
            ctx.lineTo(-r, -r * 0.7);
            ctx.lineTo(0, -r * 0.3);
            ctx.lineTo(r, -r * 0.7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            if (e.isBoss) {
              ctx.fillStyle = '#0F172A';
              ctx.fillRect(-26, -r - 12, 52, 6);
              ctx.fillStyle = '#F59E0B';
              ctx.fillRect(-26, -r - 12, 52 * (e.hp / e.maxHp), 6);
            }
            ctx.restore();
          });

          // Particles
          s.particles.forEach((pt) => {
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = Math.max(0, pt.life * 2);
            ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
            ctx.globalAlpha = 1;
          });

          // Player Ship
          ctx.save();
          ctx.translate(s.px, s.py);
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = '#22D3EE';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, -24);
          ctx.lineTo(22, 18);
          ctx.lineTo(0, 10);
          ctx.lineTo(-22, 18);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, onGameOver]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 700 / rect.width;
    const scaleY = 500 / rect.height;
    stateRef.current.px = Math.max(35, Math.min(665, (e.clientX - rect.left) * scaleX));
    stateRef.current.py = Math.max(80, Math.min(460, (e.clientY - rect.top) * scaleY));
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
            <div className="text-[11px] text-slate-400">Sector Wave</div>
            <div className="text-sm font-bold font-mono tabular-nums text-pink-400">
              Wave {wave}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div>
            <div className="text-[11px] text-slate-400">Weapons & EMP</div>
            <div className="text-xs font-mono tabular-nums text-cyan-300 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5" /> Mk.{weaponLevel}
              </span>
              <span>·</span>
              <button
                onClick={triggerEmpBomb}
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <Flame className="w-3.5 h-3.5" /> EMP: {empBombs}
              </button>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Deflector Hull</div>
            <div
              className={`text-xs font-mono tabular-nums flex items-center gap-1 ${
                hullHp > 35 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              HP: {hullHp}% · {hullHp > 35 ? 'ONLINE' : 'LOW'}
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
      </div>

      {/* Viewport */}
      <div className="relative w-full max-w-[700px] aspect-[7/5] bg-[#060913] border-x border-b border-slate-800 rounded-b-xl overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={700}
          height={500}
          onMouseMove={handleCanvasMouseMove}
          className="w-full h-full block cursor-crosshair"
        />

        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-3xl font-bold font-display text-white">Starfighter Nova</h2>
            <p className="text-sm text-slate-300 max-w-md mt-2">
              Pilot your starfighter with WASD, Arrow keys, or direct mouse movement. Auto-cannons fire continuously; press E or Shift to detonate an EMP Nova Bomb.
            </p>
            <button
              onClick={startMission}
              className="mt-6 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Game
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-bold font-display text-white">Mission Paused</h3>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setGameState('PLAYING')}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Resume Game
              </button>
              <button
                onClick={startMission}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Restart Game
              </button>
            </div>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-bold font-display text-white">Starfighter Down</h3>
            <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div>
                <div className="text-xs text-slate-400">Final Score</div>
                <div className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-0.5">
                  {score.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Sector Reached</div>
                <div className="text-xl font-bold font-mono tabular-nums text-pink-400 mt-0.5">
                  Wave {wave}
                </div>
              </div>
            </div>
            <button
              onClick={startMission}
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
