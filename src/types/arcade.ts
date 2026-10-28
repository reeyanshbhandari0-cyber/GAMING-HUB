export type GameId =
  | 'turbo-outrun'
  | 'starfighter-nova'
  | 'bastion-grid'
  | 'neon-viper'
  | 'quantum-breaker'
  | 'pulse-runner'
  | 'logic-2048'
  | 'memory-matrix';

export type GameCategory =
  | 'all'
  | 'action-racing'
  | 'arcade-classics'
  | 'strategy-puzzle';

export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'ROUND_SUMMARY'
  | 'GAME_OVER';

export interface GameMetadata {
  id: GameId;
  title: string;
  subtitle: string;
  category: Exclude<GameCategory, 'all'>;
  categoryLabel: string;
  controlsShort: string;
  controlsDetailed: { keys: string; action: string }[];
  description: string;
  rulesSummary: string[];
  accentColor: 'cyan' | 'pink' | 'amber' | 'emerald';
  baseXpMultiplier: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  gameId: GameId | 'global';
  xpReward: number;
  targetScore?: number;
}

export interface RecentMatch {
  id: string;
  gameId: GameId;
  score: number;
  xpEarned: number;
  timestamp: string;
  isNewBest: boolean;
}

export interface PlayerProfile {
  callsign: string;
  xp: number;
  totalGamesPlayed: number;
  highScores: Record<GameId, number>;
  playCounts: Record<GameId, number>;
  unlockedAchievements: string[];
  recentMatches: RecentMatch[];
  soundEnabled: boolean;
}

export interface GameProps {
  highScore: number;
  soundEnabled: boolean;
  onGameOver: (finalScore: number, detailStat?: string) => void;
  onExit: () => void;
  onToggleSound: () => void;
}
