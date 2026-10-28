import { Achievement, GameId, GameMetadata, PlayerProfile } from '../types/arcade';

export const GAMES_CATALOG: GameMetadata[] = [
  {
    id: 'turbo-outrun',
    title: 'Turbo Outrun 2099',
    subtitle: 'High-Speed Cyber Highway Racer',
    category: 'action-racing',
    categoryLabel: 'Action & Racing',
    controlsShort: 'A / D or Arrows · Space Nitro',
    controlsDetailed: [
      { keys: 'A / D or ← / →', action: 'Steer Across Highway Lanes' },
      { keys: 'W / ↑ / Space', action: 'Engage Nitro Overdrive' },
      { keys: 'S / ↓', action: 'Precision Air Brake' },
      { keys: 'P / Esc', action: 'Pause Race' },
    ],
    description:
      'Tear down a multi-lane midnight highway at 340+ KM/H. Weave past oncoming traffic for near-miss slipstream multipliers and chain nitro boosts through checkpoint gates.',
    rulesSummary: [
      'Steer smoothly between 4 highway lanes to avoid slower civilian vehicles and oncoming hazards.',
      'Pass closely beside traffic vehicles without colliding to trigger Slipstream Near-Miss bonus points.',
      'Collect blue Nitro Cells on the tarmac to refill your Overdrive gauge and shatter speed records.',
    ],
    accentColor: 'cyan',
    baseXpMultiplier: 0.15,
  },
  {
    id: 'starfighter-nova',
    title: 'Starfighter Nova',
    subtitle: 'Deep-Space Bullet-Hell Shooter',
    category: 'action-racing',
    categoryLabel: 'Action & Racing',
    controlsShort: 'WASD / Arrows · Space Fire · E Bomb',
    controlsDetailed: [
      { keys: 'WASD or Arrows', action: 'Pilot Starfighter' },
      { keys: 'Space / Mouse Click', action: 'Fire Plasma Cannons' },
      { keys: 'E or Shift', action: 'Detonate Nova EMP Bomb' },
      { keys: 'P / Esc', action: 'Pause Mission' },
    ],
    description:
      'Command an interceptor through orbital debris fields and alien dreadnought squadrons. Upgrade to triple-spread plasma cannons, deploy energy shields, and survive boss waves.',
    rulesSummary: [
      'Destroy incoming interceptor waves and dodge enemy plasma barrages.',
      'Collect glowing weapon pods to upgrade your blaster spread, activate deflector shields, or stock Nova EMP bombs.',
      'Every 5th wave deploys an armored Dreadnought Boss—target its core for massive score multipliers.',
    ],
    accentColor: 'pink',
    baseXpMultiplier: 0.12,
  },
  {
    id: 'bastion-grid',
    title: 'Bastion Grid',
    subtitle: 'Tactical Tank & Turret Defense',
    category: 'strategy-puzzle',
    categoryLabel: 'Strategy & Puzzle',
    controlsShort: 'WASD Move · Click Aim & Fire · 1-3 Build',
    controlsDetailed: [
      { keys: 'WASD or Arrows', action: 'Drive Defense Hover-Tank' },
      { keys: 'Mouse Click or Space', action: 'Fire Tank Railgun' },
      { keys: 'Keys 1 / 2 / 3', action: 'Deploy Laser Turret, Cryo Tower, or Core Repair' },
      { keys: 'P / Esc', action: 'Pause Defense' },
    ],
    description:
      'Pilot an armored hover-tank around the central Nexus Core while constructing automated laser and cryo turrets using scrap energy harvested from destroyed assault drones.',
    rulesSummary: [
      'Protect the central Nexus Core at the center of the tactical grid from perimeter breachers.',
      'Destroy enemies with your mobile hover-tank to harvest Scrap Energy.',
      'Spend Scrap Energy (Keys 1, 2, 3 or HUD buttons) to deploy automated Laser Turrets, Cryo Slow Towers, or repair Core integrity.',
    ],
    accentColor: 'amber',
    baseXpMultiplier: 0.14,
  },
  {
    id: 'neon-viper',
    title: 'Neon Viper',
    subtitle: 'Hyper-Grid Snake with Warp Portals',
    category: 'arcade-classics',
    categoryLabel: 'Arcade Classics',
    controlsShort: 'WASD / Arrows · Shift Dash',
    controlsDetailed: [
      { keys: 'WASD or Arrows', action: 'Change Viper Direction' },
      { keys: 'Shift or Space', action: 'Hold for Hyper-Speed Burst' },
      { keys: 'P / Esc', action: 'Pause Grid' },
    ],
    description:
      'Navigate a glowing cyber-serpent across a reactive grid. Chain rapid data-orb pickups before the combo timer decays and warp through edge portals to outmaneuver your own tail.',
    rulesSummary: [
      'Absorb cyan Data Orbs to grow longer and increase your base score.',
      'Chain pickups within 4 seconds of each other to build up to a 5x Combo Multiplier.',
      'Use the paired Magenta Warp Gates on the grid borders to teleport instantaneously across the arena.',
    ],
    accentColor: 'emerald',
    baseXpMultiplier: 0.25,
  },
  {
    id: 'quantum-breaker',
    title: 'Quantum Breaker',
    subtitle: 'Brick Breaker & Cyber Pong Dual Cabinet',
    category: 'arcade-classics',
    categoryLabel: 'Arcade Classics',
    controlsShort: 'Mouse or A / D / Arrows · Space Launch',
    controlsDetailed: [
      { keys: 'A / D, ← / →, or Mouse', action: 'Control Deflector Paddle' },
      { keys: 'Space or Click', action: 'Launch Quantum Sphere / Fire Paddle Laser' },
      { keys: 'P / Esc', action: 'Pause Match' },
    ],
    description:
      'Two classic kinetic arcade cabinets in one: shatter multi-layered energy vaults with multi-ball and laser power-ups in Brick Breaker, or challenge an adaptive AI in Cyber Pong Arena.',
    rulesSummary: [
      'Choose between Cyber Brick Breaker mode or 1v1 AI Pong Arena on the title screen.',
      'Angle shots off the edges of your moving paddle to impart high-velocity spin.',
      'Catch falling capsules in Brick Breaker for Multi-Ball, Wide Deflector, and Plasma Laser upgrades.',
    ],
    accentColor: 'cyan',
    baseXpMultiplier: 0.18,
  },
  {
    id: 'pulse-runner',
    title: 'Pulse Runner',
    subtitle: 'Endless Rooftop Parkour & Dash Runner',
    category: 'action-racing',
    categoryLabel: 'Action & Racing',
    controlsShort: 'W / Up / Space Jump · Shift / D Phase Dash',
    controlsDetailed: [
      { keys: 'Space, W, or ↑', action: 'Jump & Double-Jump in Mid-Air' },
      { keys: 'Shift, D, or →', action: 'Phase Dash Through Red Laser Barriers' },
      { keys: 'S or ↓', action: 'Fast-Fall / Slam to Rooftop' },
      { keys: 'P / Esc', action: 'Pause Run' },
    ],
    description:
      'Sprint across high-altitude skyline rooftops. Execute precision double-jumps over abyssal gaps and trigger invulnerable Phase Dashes to shatter red laser barricades.',
    rulesSummary: [
      'Leap across skyline gaps using single and mid-air double jumps.',
      'Red Laser Barriers cannot be jumped over—trigger your Phase Dash (Shift / D) to smash straight through them for bonus points.',
      'Collect floating Data Shards to charge your score multiplier as run velocity accelerates.',
    ],
    accentColor: 'pink',
    baseXpMultiplier: 0.16,
  },
  {
    id: 'logic-2048',
    title: '2048 Logic Core',
    subtitle: 'Quantum Number Synthesis Matrix',
    category: 'strategy-puzzle',
    categoryLabel: 'Strategy & Puzzle',
    controlsShort: 'WASD / Arrows · Z Undo Move',
    controlsDetailed: [
      { keys: 'WASD or Arrow Keys', action: 'Slide All Core Nodes' },
      { keys: 'Z or Undo Button', action: 'Rewind Last Move (3 Charges)' },
      { keys: 'R', action: 'Reset Matrix' },
    ],
    description:
      'Slide and fuse matching power nodes inside a 4x4 quantum processor grid. Plan multi-tile chain merges, utilize tactical undos, and synthesize the legendary 2048 singularity core.',
    rulesSummary: [
      'Slide all tiles in any of the 4 cardinal directions; matching numbers fuse into their doubled sum.',
      'Fusing multiple pairs in a single slide awards a Chain Synthesis bonus.',
      'Use up to 3 Tactical Undo charges per session to recover from a grid lock.',
    ],
    accentColor: 'amber',
    baseXpMultiplier: 0.12,
  },
  {
    id: 'memory-matrix',
    title: 'Memory Matrix',
    subtitle: 'Neural Sequence & Cipher Recall Puzzle',
    category: 'strategy-puzzle',
    categoryLabel: 'Strategy & Puzzle',
    controlsShort: 'Mouse / Touch Click Nodes',
    controlsDetailed: [
      { keys: 'Mouse Click / Tap', action: 'Activate Neural Node or Flip Cipher Card' },
      { keys: '1 - 9 / Numpad', action: 'Quick-Select Grid Nodes' },
      { keys: 'R', action: 'Restart Calibration' },
    ],
    description:
      'Test your working memory across two neural training protocols: Sequence Recall (reproduce expanding light-and-sound patterns) and Cipher Match (decrypt paired cyber-glyphs under streak multipliers).',
    rulesSummary: [
      'In Sequence Recall mode, watch the illuminated neural path and replay the exact node order.',
      'In Cipher Match mode, flip and match pairs of encrypted symbols—consecutive matches build a high-value Streak Multiplier.',
      'Completing boards quickly awards Time Efficiency bonus points.',
    ],
    accentColor: 'emerald',
    baseXpMultiplier: 0.22,
  },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-boot',
    title: 'System Initialized',
    description: 'Complete your first match in any Nexus Arcade game.',
    gameId: 'global',
    xpReward: 150,
  },
  {
    id: 'polymath-player',
    title: 'Arcade Polymath',
    description: 'Play at least 4 different games in the Nexus catalog.',
    gameId: 'global',
    xpReward: 400,
  },
  {
    id: 'veteran-challenger',
    title: 'Cabinet Veteran',
    description: 'Complete 10 total arcade sessions across the hub.',
    gameId: 'global',
    xpReward: 500,
  },
  {
    id: 'outrun-speedster',
    title: 'Midnight Slipstream',
    description: 'Score 2,500+ points in Turbo Outrun 2099.',
    gameId: 'turbo-outrun',
    xpReward: 300,
    targetScore: 2500,
  },
  {
    id: 'outrun-legend',
    title: 'Apex Highway Phantom',
    description: 'Score 7,500+ points in Turbo Outrun 2099.',
    gameId: 'turbo-outrun',
    xpReward: 600,
    targetScore: 7500,
  },
  {
    id: 'nova-ace',
    title: 'Starfighter Ace',
    description: 'Score 3,000+ points in Starfighter Nova.',
    gameId: 'starfighter-nova',
    xpReward: 300,
    targetScore: 3000,
  },
  {
    id: 'nova-dreadnought',
    title: 'Dreadnought Slayer',
    description: 'Score 8,000+ points in Starfighter Nova.',
    gameId: 'starfighter-nova',
    xpReward: 650,
    targetScore: 8000,
  },
  {
    id: 'bastion-commander',
    title: 'Iron Bastion',
    description: 'Score 2,000+ points defending the core in Bastion Grid.',
    gameId: 'bastion-grid',
    xpReward: 350,
    targetScore: 2000,
  },
  {
    id: 'viper-overclock',
    title: 'Serpent Overclock',
    description: 'Score 1,200+ points in Neon Viper.',
    gameId: 'neon-viper',
    xpReward: 300,
    targetScore: 1200,
  },
  {
    id: 'quantum-shatter',
    title: 'Quantum Deflector',
    description: 'Score 2,000+ points in Quantum Breaker.',
    gameId: 'quantum-breaker',
    xpReward: 300,
    targetScore: 2000,
  },
  {
    id: 'runner-skyline',
    title: 'Skyline Phase Walker',
    description: 'Score 2,500+ points in Pulse Runner.',
    gameId: 'pulse-runner',
    xpReward: 300,
    targetScore: 2500,
  },
  {
    id: 'logic-architect',
    title: 'Matrix Synthesis',
    description: 'Score 2,500+ points in 2048 Logic Core.',
    gameId: 'logic-2048',
    xpReward: 350,
    targetScore: 2500,
  },
  {
    id: 'memory-savant',
    title: 'Neural Recall Savant',
    description: 'Score 1,500+ points in Memory Matrix.',
    gameId: 'memory-matrix',
    xpReward: 300,
    targetScore: 1500,
  },
];

export const INITIAL_PROFILE: PlayerProfile = {
  callsign: 'PLAYER_ONE',
  xp: 250,
  totalGamesPlayed: 0,
  highScores: {
    'turbo-outrun': 0,
    'starfighter-nova': 0,
    'bastion-grid': 0,
    'neon-viper': 0,
    'quantum-breaker': 0,
    'pulse-runner': 0,
    'logic-2048': 0,
    'memory-matrix': 0,
  },
  playCounts: {
    'turbo-outrun': 0,
    'starfighter-nova': 0,
    'bastion-grid': 0,
    'neon-viper': 0,
    'quantum-breaker': 0,
    'pulse-runner': 0,
    'logic-2048': 0,
    'memory-matrix': 0,
  },
  unlockedAchievements: [],
  recentMatches: [],
  soundEnabled: true,
};

export function getLevelInfo(xp: number): {
  level: number;
  rankTitle: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const xpPerLevel = 500;
  const level = Math.floor(xp / xpPerLevel) + 1;
  const currentLevelXp = xp % xpPerLevel;
  const nextLevelXp = xpPerLevel;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));

  const ranks = [
    'Arcade Initiate',
    'Circuit Runner',
    'Grid Specialist',
    'Cyber Vanguard',
    'Starlight Pilot',
    'Quantum Tactician',
    'Nexus Commander',
    'Apex Grandmaster',
  ];
  const rankTitle = ranks[Math.min(ranks.length - 1, Math.floor((level - 1) / 2))];

  return { level, rankTitle, currentLevelXp, nextLevelXp, progressPercent };
}
