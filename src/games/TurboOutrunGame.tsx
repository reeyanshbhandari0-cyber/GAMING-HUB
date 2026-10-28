import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameProps, GameState } from '../types/arcade';
import { soundFX } from '../utils/sound';
import { Gauge, ShieldAlert, Zap, Play, RotateCcw, Pause } from 'lucide-react';

interface TrafficCar {
  lane: number; // 0 to 3
  y: number; // -100 to 600
  speed: number;
  color: string;
  passed: boolean;
  isNitroCell?: boolean;
}

type CircuitDifficulty = 'NIGHT_CRUISE' | 'HYPER_HIGHWAY' | 'APEX_OVERDRIVE';

export const TurboOutrunGame: React.FC<GameProps> = ({
  highScore,
  onGameOver,
}) => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [circuit, setCircuit] = useState<CircuitDifficulty>('HYPER_HIGHWAY');
  const [score, setScore] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(180);
  const [shieldHp, setShieldHp] = useState(100);
  const [nitroFuel, setNitroFuel] = useState(100);
  const [nearMissCount, setNearMissCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('HIGHWAY CLEAR');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const stateRef = useRef({
    playerX: 350, // road spans x: 140..560 (width 420, 4 lanes of 105px)
    speed: 220,
    score: 0,
    shield: 100,
    nitro: 100,
    nearMisses: 0,
    roadOffset: 0,
    traffic: [] as TrafficCar[],
    spawnTimer: 0,
    invulnerableTimer: 0,
    nitroActive: false,
  });

  const startRace = useCallback(() => {
    const baseSpeed =
      circuit === 'NIGHT_CRUISE' ? 190 : circuit === 'HYPER_HIGHWAY' ? 240 : 295;
    stateRef.current = {
      playerX: 350,
      speed: baseSpeed,
      score: 0,
      shield: 100,
      nitro: 100,
      nearMisses: 0,
      roadOffset: 0,
      traffic: [],
      spawnTimer: 0,
      invulnerableTimer: 0,
      nitroActive: false,
    };
    setScore(0);
    setSpeedKmh(baseSpeed);
    setShieldHp(100);
    setNitroFuel(100);
    setNearMissCount(0);
    setStatusMessage('SYSTEMS NOMINAL');
    setGameState('PLAYING');
    soundFX.playBoost();
  }, [circuit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
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

    let animationFrameId: number;
    let lastTime = performance.now();

    const baseTargetSpeed =
      circuit === 'NIGHT_CRUISE' ? 210 : circuit === 'HYPER_HIGHWAY' ? 265 : 320;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const s = stateRef.current;
      const keys = keysRef.current;

      // Steering
      const steerSpeed = 320;
      if (keys['ArrowLeft'] || keys['KeyA']) {
        s.playerX = Math.max(175, s.playerX - steerSpeed * dt);
      }
      if (keys['ArrowRight'] || keys['KeyD']) {
        s.playerX = Math.min(525, s.playerX + steerSpeed * dt);
      }

      // Nitro & Brakes
      const wantsNitro = keys['Space'] || keys['ArrowUp'] || keys['KeyW'];
      const wantsBrake = keys['ArrowDown'] || keys['KeyS'];

      if (wantsNitro && s.nitro > 2) {
        s.nitroActive = true;
        s.nitro = Math.max(0, s.nitro - 28 * dt);
        s.speed = Math.min(440, s.speed + 260 * dt);
      } else {
        s.nitroActive = false;
        s.nitro = Math.min(100, s.nitro + 9 * dt);
        if (wantsBrake) {
          s.speed = Math.max(130, s.speed - 220 * dt);
        } else {
          // Accelerate naturally toward target speed + progression bonus
          const target = baseTargetSpeed + Math.min(90, s.score * 0.008);
          if (s.speed < target) s.speed = Math.min(target, s.speed + 90 * dt);
          else s.speed = Math.max(target, s.speed - 110 * dt);
        }
      }

      if (s.invulnerableTimer > 0) {
        s.invulnerableTimer = Math.max(0, s.invulnerableTimer - dt);
      }

      // Road & Score update
      s.roadOffset = (s.roadOffset + s.speed * 1.9 * dt) % 80;
      s.score += s.speed * dt * (s.nitroActive ? 0.55 : 0.3);

      // Spawn Traffic & Nitro Cells
      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) {
        const lane = Math.floor(Math.random() * 4);
        const isNitroCell = Math.random() < 0.22;
        const colors = ['#EC4899', '#F59E0B', '#A855F7', '#38BDF8'];
        s.traffic.push({
          lane,
          y: -90,
          speed: isNitroCell ? 110 : 90 + Math.random() * 75,
          color: colors[lane % colors.length],
          passed: false,
          isNitroCell,
        });
        s.spawnTimer = Math.max(0.32, 0.88 - s.speed / 650);
      }

      // Update Traffic & Collision
      const playerY = 415;
      const laneCenters = [192, 297, 402, 507];

      for (let i = s.traffic.length - 1; i >= 0; i--) {
        const car = s.traffic[i];
        const relativeSpeed = (s.speed - car.speed) * 1.65;
        car.y += relativeSpeed * dt;

        const carX = laneCenters[car.lane];
        const dx = Math.abs(s.playerX - carX);
        const dy = Math.abs(playerY - car.y);

        if (car.isNitroCell) {
          if (dx < 42 && dy < 46) {
            s.nitro = Math.min(100, s.nitro + 35);
            s.score += 200;
            soundFX.playPickup();
            setStatusMessage('NITRO CELL +200');
            s.traffic.splice(i, 1);
            continue;
          }
        } else {
          // Collision check
          if (dx < 44 && dy < 62 && s.invulnerableTimer <= 0) {
            s.shield = Math.max(0, s.shield - 34);
            s.speed = Math.max(120, s.speed * 0.6);
            s.invulnerableTimer = 1.1;
            soundFX.playExplosion();
            setStatusMessage('HULL IMPACT -34%');
            s.traffic.splice(i, 1);
            if (s.shield <= 0) {
              soundFX.playGameOver();
              setGameState('GAME_OVER');
              onGameOver(Math.floor(s.score), `${s.nearMisses} Slipstreams`);
              return;
            }
            continue;
          }

          // Slipstream near-miss check
          if (!car.passed && car.y > playerY + 35) {
            car.passed = true;
            if (dx >= 44 && dx < 88) {
              s.nearMisses += 1;
              s.score += 150;
              soundFX.playMove();
              setStatusMessage('SLIPSTREAM +150');
            }
          }
        }

        if (car.y > 580) {
          s.traffic.splice(i, 1);
        }
      }

      setScore(Math.floor(s.score));
      setSpeedKmh(Math.floor(s.speed));
      setShieldHp(Math.ceil(s.shield));
      setNitroFuel(Math.floor(s.nitro));
      setNearMissCount(s.nearMisses);

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#070B14';
          ctx.fillRect(0, 0, 700, 500);

          // Cyber roadside grid lines
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.16)';
          ctx.lineWidth = 1;
          for (let y = (s.roadOffset % 40); y < 500; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(140, y);
            ctx.moveTo(560, y);
            ctx.lineTo(700, y);
            ctx.stroke();
          }

          // Highway Asphalt
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(140, 0, 420, 500);

          // Glowing Highway Borders
          ctx.strokeStyle = s.nitroActive ? '#EC4899' : '#06B6D4';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(140, 0);
          ctx.lineTo(140, 500);
          ctx.moveTo(560, 0);
          ctx.lineTo(560, 500);
          ctx.stroke();

          // Lane Dividers
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 3;
          ctx.setLineDash([28, 28]);
          ctx.lineDashOffset = -s.roadOffset;
          [245, 350, 455].forEach((lx) => {
            ctx.beginPath();
            ctx.moveTo(lx, 0);
            ctx.lineTo(lx, 500);
            ctx.stroke();
          });
          ctx.setLineDash([]);

          // Draw Traffic & Nitro Pickups
          s.traffic.forEach((car) => {
            const cx = laneCenters[car.lane];
            if (car.isNitroCell) {
              ctx.fillStyle = '#06B6D4';
              ctx.beginPath();
              ctx.arc(cx, car.y, 16, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#E0F2FE';
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.fillStyle = '#020617';
              ctx.font = 'bold 12px monospace';
              ctx.textAlign = 'center';
              ctx.fillText('N2O', cx, car.y + 4);
            } else {
              // Traffic Vehicle
              ctx.fillStyle = '#1E293B';
              ctx.strokeStyle = car.color;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.roundRect(cx - 24, car.y - 38, 48, 76, 8);
              ctx.fill();
              ctx.stroke();

              // Windshield & Taillights
              ctx.fillStyle = '#090D16';
              ctx.fillRect(cx - 18, car.y - 22, 36, 22);
              ctx.fillStyle = car.color;
              ctx.fillRect(cx - 20, car.y + 30, 12, 5);
              ctx.fillRect(cx + 8, car.y + 30, 12, 5);
            }
          });

          // Draw Player Interceptor Car
          const px = s.playerX;
          const py = playerY;
          const blink = s.invulnerableTimer > 0 && Math.floor(now / 80) % 2 === 0;
          if (!blink) {
            if (s.nitroActive) {
              // Twin Nitro Plumes
              ctx.fillStyle = '#22D3EE';
              ctx.beginPath();
              ctx.moveTo(px - 14, py + 38);
              ctx.lineTo(px - 8, py + 72 + Math.random() * 14);
              ctx.lineTo(px - 2, py + 38);
              ctx.moveTo(px + 2, py + 38);
              ctx.lineTo(px + 8, py + 72 + Math.random() * 14);
              ctx.lineTo(px + 14, py + 38);
              ctx.fill();
            }

            ctx.fillStyle = '#083344';
            ctx.strokeStyle = '#22D3EE';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(px - 25, py - 40, 50, 80, 10);
            ctx.fill();
            ctx.stroke();

            // Canopy
            ctx.fillStyle = '#020617';
            ctx.beginPath();
            ctx.roundRect(px - 17, py - 18, 34, 34, 6);
            ctx.fill();

            // Rear Lightbar
            ctx.fillStyle = '#EC4899';
            ctx.fillRect(px - 20, py + 32, 40, 5);
          }
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, circuit, onGameOver]);

  const nudgeSteer = (dir: -1 | 1) => {
    stateRef.current.playerX = Math.max(
      175,
      Math.min(525, stateRef.current.playerX + dir * 65)
    );
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Unobtrusive Top HUD Bar */}
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
          <div className="hidden sm:block">
            <div className="text-[11px] text-slate-400">Speed</div>
            <div className="text-sm font-semibold font-mono tabular-nums text-slate-200 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              {speedKmh} KM/H
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div>
            <div className="text-[11px] text-slate-400">Nitro Boost</div>
            <div className="text-xs font-mono tabular-nums text-cyan-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              {nitroFuel}% · {statusMessage}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Hull Armor</div>
            <div
              className={`text-xs font-mono tabular-nums flex items-center gap-1 ${
                shieldHp > 35 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              HP: {shieldHp}% · {shieldHp > 35 ? 'STABLE' : 'CRITICAL'}
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

      {/* Main Game Viewport */}
      <div className="relative w-full max-w-[700px] aspect-[7/5] bg-[#070B14] border-x border-b border-slate-800 rounded-b-xl overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={700}
          height={500}
          className="w-full h-full block"
        />

        {/* TITLE MENU OVERLAY */}
        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-3xl font-bold font-display text-white tracking-tight">
              Turbo Outrun 2099
            </h2>
            <p className="text-sm text-slate-300 max-w-md mt-2">
              Weave through midnight highway traffic at extreme velocity. Pass closely beside vehicles for +150 Slipstream combos and collect N2O cells.
            </p>

            {/* Circuit Selector */}
            <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg mt-5">
              {(
                [
                  { id: 'NIGHT_CRUISE', label: 'Standard Cruise' },
                  { id: 'HYPER_HIGHWAY', label: 'Hyper Highway' },
                  { id: 'APEX_OVERDRIVE', label: 'Apex Overdrive' },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCircuit(c.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    circuit === c.id
                      ? 'bg-cyan-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <button
              onClick={startRace}
              className="mt-6 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Game
            </button>
          </div>
        )}

        {/* PAUSED OVERLAY */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-bold font-display text-white">Race Paused</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
              Current Score: {score.toLocaleString()} · Slipstreams: {nearMissCount}
            </p>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setGameState('PLAYING')}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Resume Game
              </button>
              <button
                onClick={startRace}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Restart Game
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-bold font-display text-white">Hull Depleted</h3>
            <p className="text-sm text-slate-400 mt-1">
              Highway run concluded. Telemetry logged to your Arcade Profile.
            </p>
            <div className="grid grid-cols-3 gap-6 my-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div>
                <div className="text-xs text-slate-400">Final Score</div>
                <div className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-0.5">
                  {score.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Slipstreams</div>
                <div className="text-xl font-bold font-mono tabular-nums text-pink-400 mt-0.5">
                  {nearMissCount}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Top Speed</div>
                <div className="text-xl font-bold font-mono tabular-nums text-amber-400 mt-0.5">
                  {speedKmh} KM/H
                </div>
              </div>
            </div>
            <button
              onClick={startRace}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Touch / Mouse Assist Controls */}
      <div className="w-full max-w-[700px] mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => nudgeSteer(-1)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 whitespace-nowrap shrink-0"
          >
            Steer Left (A / ←)
          </button>
          <button
            onClick={() => nudgeSteer(1)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 whitespace-nowrap shrink-0"
          >
            Steer Right (D / →)
          </button>
        </div>
        <button
          onMouseDown={() => {
            keysRef.current['Space'] = true;
          }}
          onMouseUp={() => {
            keysRef.current['Space'] = false;
          }}
          onTouchStart={() => {
            keysRef.current['Space'] = true;
          }}
          onTouchEnd={() => {
            keysRef.current['Space'] = false;
          }}
          className="px-4 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 rounded-lg text-xs font-semibold text-cyan-300 whitespace-nowrap shrink-0"
        >
          Hold Nitro Boost (Space)
        </button>
      </div>
    </div>
  );
};
