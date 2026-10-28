import React from 'react';
import { GameId } from '../types/arcade';

interface GameArtworkProps {
  gameId: GameId;
  className?: string;
}

export const GameArtwork: React.FC<GameArtworkProps> = ({ gameId, className = '' }) => {
  switch (gameId) {
    case 'turbo-outrun':
      return (
        <svg
          viewBox="0 0 600 340"
          className={`w-full h-full object-cover bg-[#080D1A] ${className}`}
          aria-label="Turbo Outrun 2099 highway racing artwork"
        >
          <defs>
            <linearGradient id="outrunSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#070B14" />
              <stop offset="55%" stopColor="#1E1B4B" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <rect width="600" height="340" fill="url(#outrunSky)" />
          {/* Horizon Synth Sun */}
          <circle cx="300" cy="145" r="54" fill="url(#sunGrad)" opacity="0.85" />
          {/* Skyline silhouette */}
          <path
            d="M0 170 L90 170 L90 135 L125 135 L125 165 L170 165 L170 115 L210 115 L210 170 L390 170 L390 120 L430 120 L430 155 L475 155 L475 130 L515 130 L515 170 L600 170 L600 340 L0 340 Z"
            fill="#070B14"
          />
          {/* Perspective Highway Grid */}
          <polygon points="240,170 360,170 560,340 40,340" fill="#0F172A" stroke="#06B6D4" strokeWidth="2" />
          <line x1="280" y1="170" x2="175" y2="340" stroke="#334155" strokeWidth="2" strokeDasharray="10 8" />
          <line x1="300" y1="170" x2="300" y2="340" stroke="#22D3EE" strokeWidth="3" strokeDasharray="14 10" />
          <line x1="320" y1="170" x2="425" y2="340" stroke="#334155" strokeWidth="2" strokeDasharray="10 8" />
          {/* Sports Car Rear Silhouette */}
          <g transform="translate(235, 235)">
            <rect x="10" y="38" width="110" height="22" rx="5" fill="#020617" />
            <polygon points="22,12 108,12 124,42 6,42" fill="#0E7490" stroke="#22D3EE" strokeWidth="2" />
            <polygon points="30,16 100,16 110,34 20,34" fill="#090D16" />
            {/* Taillights */}
            <rect x="14" y="38" width="28" height="8" rx="2" fill="#EC4899" />
            <rect x="88" y="38" width="28" height="8" rx="2" fill="#EC4899" />
            <rect x="48" y="40" width="34" height="5" rx="2" fill="#22D3EE" />
            {/* Nitro Exhaust */}
            <polygon points="52,60 65,86 44,60" fill="#22D3EE" opacity="0.9" />
            <polygon points="78,60 65,86 86,60" fill="#22D3EE" opacity="0.9" />
          </g>
        </svg>
      );

    case 'starfighter-nova':
      return (
        <svg
          viewBox="0 0 600 340"
          className={`w-full h-full object-cover bg-[#070B14] ${className}`}
          aria-label="Starfighter Nova space shooter artwork"
        >
          <rect width="600" height="340" fill="#070B14" />
          {/* Starfield */}
          <circle cx="80" cy="60" r="2" fill="#94A3B8" />
          <circle cx="510" cy="45" r="2.5" fill="#22D3EE" />
          <circle cx="440" cy="120" r="1.5" fill="#E2E8F0" />
          <circle cx="140" cy="210" r="2" fill="#EC4899" />
          <circle cx="520" cy="260" r="2" fill="#94A3B8" />
          {/* Nebula ring */}
          <ellipse cx="300" cy="110" rx="190" ry="55" fill="none" stroke="#EC4899" strokeWidth="1.5" strokeDasharray="6 8" opacity="0.4" />
          {/* Enemy Dreadnought Top */}
          <g transform="translate(230, 35)">
            <polygon points="70,85 0,25 35,0 105,0 140,25" fill="#1E293B" stroke="#EC4899" strokeWidth="2.5" />
            <circle cx="70" cy="42" r="14" fill="#EC4899" />
          </g>
          {/* Laser Beams */}
          <line x1="282" y1="220" x2="282" y2="125" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />
          <line x1="318" y1="220" x2="318" y2="125" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />
          {/* Player Starfighter */}
          <g transform="translate(250, 210)">
            <polygon points="50,0 96,75 68,65 50,82 32,65 4,75" fill="#0F172A" stroke="#22D3EE" strokeWidth="2.5" />
            <polygon points="50,18 62,52 38,52" fill="#06B6D4" />
            <circle cx="50" cy="86" r="8" fill="#F59E0B" />
          </g>
        </svg>
      );

    case 'bastion-grid':
      return (
        <svg
          viewBox="0 0 600 340"
          className={`w-full h-full object-cover bg-[#090F1B] ${className}`}
          aria-label="Bastion Grid tactical defense artwork"
        >
          <rect width="600" height="340" fill="#090F1B" />
          {/* Tactical Grid Lines */}
          <g stroke="#1E293B" strokeWidth="1.5">
            <line x1="0" y1="85" x2="600" y2="85" />
            <line x1="0" y1="170" x2="600" y2="170" />
            <line x1="0" y1="255" x2="600" y2="255" />
            <line x1="150" y1="0" x2="150" y2="340" />
            <line x1="300" y1="0" x2="300" y2="340" />
            <line x1="450" y1="0" x2="450" y2="340" />
          </g>
          {/* Central Core */}
          <circle cx="300" cy="170" r="68" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="8 6" />
          <polygon points="300,126 338,148 338,192 300,214 262,192 262,148" fill="#0F172A" stroke="#22D3EE" strokeWidth="3" />
          <circle cx="300" cy="170" r="18" fill="#06B6D4" />
          {/* Defense Tank */}
          <g transform="translate(145, 195)">
            <rect x="0" y="0" width="54" height="44" rx="8" fill="#1E293B" stroke="#F59E0B" strokeWidth="2.5" />
            <circle cx="27" cy="22" r="12" fill="#F59E0B" />
            <line x1="27" y1="22" x2="68" y2="-8" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
          </g>
          {/* Enemy Swarm Node */}
          <circle cx="445" cy="95" r="18" fill="#831843" stroke="#EC4899" strokeWidth="2.5" />
          <line x1="213" y1="187" x2="430" y2="102" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="6 4" />
        </svg>
      );

    case 'neon-viper':
      return (
        <svg
          viewBox="0 0 600 340"
          className={`w-full h-full object-cover bg-[#071118] ${className}`}
          aria-label="Neon Viper cyber snake artwork"
        >
          <rect width="600" height="340" fill="#071118" />
          {/* Subtle Matrix */}
          <g stroke="#0F293A" strokeWidth="1">
            <line x1="0" y1="110" x2="600" y2="110" />
            <line x1="0" y1="220" x2="600" y2="220" />
            <line x1="200" y1="0" x2="200" y2="340" />
            <line x1="400" y1="0" x2="400" y2="340" />
          </g>
          {/* Snake Segments */}
          <path
            d="M 110 240 L 230 240 L 230 130 L 390 130 L 390 190 L 460 190"
            fill="none"
            stroke="#10B981"
            strokeWidth="26"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Snake Head */}
          <rect x="445" y="173" width="34" height="34" rx="8" fill="#34D399" />
          {/* Target Orb */}
          <circle cx="525" cy="190" r="14" fill="#22D3EE" />
          <circle cx="525" cy="190" r="24" fill="none" stroke="#22D3EE" strokeWidth="2" opacity="0.5" />
        </svg>
      );

    case 'quantum-breaker':
      return (
        <svg
          viewBox="0 0 600 340"
          className={`w-full h-full object-cover bg-[#090D1A] ${className}`}
          aria-label="Quantum Breaker brick breaker artwork"
        >
          <rect width="600" height="340" fill="#090D1A" />
          {/* Bricks */}
          <g transform="translate(90, 48)">
            <rect x="0" y="0" width="95" height="24" rx="4" fill="#06B6D4" />
            <rect x="108" y="0" width="95" height="24" rx="4" fill="#06B6D4" />
            <rect x="216" y="0" width="95" height="24" rx="4" fill="#06B6D4" />
            <rect x="324" y="0" width="95" height="24" rx="4" fill="#06B6D4" />

            <rect x="0" y="34" width="95" height="24" rx="4" fill="#EC4899" />
            <rect x="108" y="34" width="95" height="24" rx="4" fill="#EC4899" />
            <rect x="324" y="34" width="95" height="24" rx="4" fill="#EC4899" />

            <rect x="0" y="68" width="95" height="24" rx="4" fill="#F59E0B" />
            <rect x="216" y="68" width="95" height="24" rx="4" fill="#F59E0B" />
          </g>
          {/* Ball Trajectory */}
          <polyline
            points="290,115 350,265 430,165"
            fill="none"
            stroke="#22D3EE"
            strokeWidth="3"
            strokeDasharray="6 6"
          />
          <circle cx="430" cy="165" r="11" fill="#F8FAFC" stroke="#22D3EE" strokeWidth="3" />
          {/* Paddle */}
          <rect x="265" y="275" width="150" height="18" rx="9" fill="#22D3EE" />
        </svg>
      );

    case 'pulse-runner':
      return (
        <svg
          viewBox="0 0 600 340"
          className={`w-full h-full object-cover bg-[#0A0D1C] ${className}`}
          aria-label="Pulse Runner endless platformer artwork"
        >
          <rect width="600" height="340" fill="#0A0D1C" />
          {/* Rooftop Platforms */}
          <rect x="0" y="250" width="240" height="90" fill="#1E293B" stroke="#22D3EE" strokeWidth="2" />
          <rect x="330" y="215" width="270" height="125" fill="#1E293B" stroke="#EC4899" strokeWidth="2" />
          {/* Laser Barrier */}
          <rect x="460" y="115" width="12" height="100" rx="6" fill="#EC4899" />
          {/* Runner Silhouette mid-leap */}
          <g transform="translate(245, 145)">
            <line x1="-45" y1="30" x2="5" y2="30" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />
            <line x1="-30" y1="45" x2="10" y2="45" stroke="#EC4899" strokeWidth="3" strokeLinecap="round" />
            <circle cx="38" cy="12" r="11" fill="#22D3EE" />
            <path d="M22 30 L52 24 L65 48 L36 56 Z" fill="#F8FAFC" />
          </g>
        </svg>
      );

    case 'logic-2048':
      return (
        <svg
          viewBox="0 0 600 340"
          className={`w-full h-full object-cover bg-[#0B0F19] ${className}`}
          aria-label="2048 Logic Core puzzle artwork"
        >
          <rect width="600" height="340" fill="#0B0F19" />
          <g transform="translate(175, 45)">
            <rect width="250" height="250" rx="16" fill="#111827" stroke="#334155" strokeWidth="2" />
            <rect x="16" y="16" width="102" height="102" rx="10" fill="#1E293B" stroke="#06B6D4" strokeWidth="2" />
            <text x="67" y="77" textAnchor="middle" fill="#22D3EE" fontSize="28" fontWeight="bold" fontFamily="monospace">
              512
            </text>
            <rect x="132" y="16" width="102" height="102" rx="10" fill="#1E293B" stroke="#EC4899" strokeWidth="2" />
            <text x="183" y="77" textAnchor="middle" fill="#F472B6" fontSize="26" fontWeight="bold" fontFamily="monospace">
              1024
            </text>
            <rect x="16" y="132" width="102" height="102" rx="10" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />
            <text x="67" y="193" textAnchor="middle" fill="#94A3B8" fontSize="28" fontWeight="bold" fontFamily="monospace">
              256
            </text>
            <rect x="132" y="132" width="102" height="102" rx="10" fill="#451A03" stroke="#F59E0B" strokeWidth="2.5" />
            <text x="183" y="193" textAnchor="middle" fill="#FBBF24" fontSize="26" fontWeight="bold" fontFamily="monospace">
              2048
            </text>
          </g>
        </svg>
      );

    case 'memory-matrix':
      return (
        <svg
          viewBox="0 0 600 340"
          className={`w-full h-full object-cover bg-[#08101D] ${className}`}
          aria-label="Memory Matrix neural puzzle artwork"
        >
          <rect width="600" height="340" fill="#08101D" />
          <g transform="translate(185, 55)">
            {[0, 1, 2].map((row) =>
              [0, 1, 2].map((col) => {
                const active = (row === 0 && col === 1) || (row === 1 && col === 1) || (row === 2 && col === 2);
                return (
                  <rect
                    key={`${row}-${col}`}
                    x={col * 80}
                    y={row * 80}
                    width="66"
                    height="66"
                    rx="12"
                    fill={active ? '#06B6D4' : '#1E293B'}
                    stroke={active ? '#67E8F9' : '#334155'}
                    strokeWidth="2"
                  />
                );
              })
            )}
            <polyline
              points="113,33 113,113 193,193"
              fill="none"
              stroke="#F8FAFC"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      );
  }
};
