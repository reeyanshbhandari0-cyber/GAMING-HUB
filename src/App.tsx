/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ACHIEVEMENTS,
  GAMES_CATALOG,
  INITIAL_PROFILE,
  getLevelInfo,
} from './data/gamesCatalog';
import {
  Achievement,
  GameCategory,
  GameId,
  PlayerProfile,
} from './types/arcade';
import { soundFX } from './utils/sound';
import { GameArtwork } from './components/GameArtwork';
import { ProfileModal } from './components/ProfileModal';
import { TurboOutrunGame } from './games/TurboOutrunGame';
import { StarfighterNovaGame } from './games/StarfighterNovaGame';
import { BastionGridGame } from './games/BastionGridGame';
import { NeonViperGame } from './games/NeonViperGame';
import { QuantumBreakerGame } from './games/QuantumBreakerGame';
import { PulseRunnerGame } from './games/PulseRunnerGame';
import { Logic2048Game } from './games/Logic2048Game';
import { MemoryMatrixGame } from './games/MemoryMatrixGame';
import {
  Play,
  Trophy,
  Award,
  Search,
  ArrowLeft,
  Volume2,
  VolumeX,
  Gamepad2,
  Keyboard,
} from 'lucide-react';

const STORAGE_KEY = 'nexus_arcade_profile_v1';

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_PROFILE,
          ...parsed,
          highScores: { ...INITIAL_PROFILE.highScores, ...(parsed.highScores || {}) },
          playCounts: { ...INITIAL_PROFILE.playCounts, ...(parsed.playCounts || {}) },
        };
      }
    } catch {
      // Fallback to initial profile
    }
    return INITIAL_PROFILE;
  });

  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unlockedToast, setUnlockedToast] = useState<Achievement | null>(null);

  useEffect(() => {
    soundFX.setEnabled(profile.soundEnabled);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage quota issues
    }
  }, [profile]);

  const levelInfo = useMemo(() => getLevelInfo(profile.xp), [profile.xp]);

  const filteredGames = useMemo(() => {
    return GAMES_CATALOG.filter((game) => {
      const matchesCat =
        selectedCategory === 'all' || game.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        game.title.toLowerCase().includes(q) ||
        game.subtitle.toLowerCase().includes(q) ||
        game.categoryLabel.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const activeGameMeta = useMemo(
    () => GAMES_CATALOG.find((g) => g.id === activeGameId) || null,
    [activeGameId]
  );

  const handleRecordGameResult = useCallback(
    (gameId: GameId, finalScore: number) => {
      setProfile((prev) => {
        const gameMeta = GAMES_CATALOG.find((g) => g.id === gameId);
        const multiplier = gameMeta?.baseXpMultiplier ?? 0.15;
        const baseSessionXp = 45 + Math.floor(finalScore * multiplier);

        const prevBest = prev.highScores[gameId] || 0;
        const isNewBest = finalScore > prevBest;
        const nextHighScores = {
          ...prev.highScores,
          [gameId]: Math.max(prevBest, finalScore),
        };
        const nextPlayCounts = {
          ...prev.playCounts,
          [gameId]: (prev.playCounts[gameId] || 0) + 1,
        };
        const nextTotalPlayed = prev.totalGamesPlayed + 1;

        // Check newly unlocked achievements
        const newlyUnlocked: Achievement[] = [];
        const uniqueGamesPlayed = Object.values(nextPlayCounts).filter(
          (count) => count > 0
        ).length;

        ACHIEVEMENTS.forEach((ach) => {
          if (prev.unlockedAchievements.includes(ach.id)) return;
          if (ach.id === 'first-boot' && nextTotalPlayed >= 1) {
            newlyUnlocked.push(ach);
          } else if (ach.id === 'polymath-player' && uniqueGamesPlayed >= 4) {
            newlyUnlocked.push(ach);
          } else if (ach.id === 'veteran-challenger' && nextTotalPlayed >= 10) {
            newlyUnlocked.push(ach);
          } else if (
            ach.gameId === gameId &&
            ach.targetScore &&
            finalScore >= ach.targetScore
          ) {
            newlyUnlocked.push(ach);
          }
        });

        const achievementXp = newlyUnlocked.reduce((sum, a) => sum + a.xpReward, 0);
        if (newlyUnlocked.length > 0) {
          soundFX.playAchievement();
          setUnlockedToast(newlyUnlocked[0]);
          setTimeout(() => setUnlockedToast(null), 4500);
        }

        const totalEarnedXp = baseSessionXp + achievementXp;
        const matchEntry = {
          id: `${Date.now()}-${Math.random()}`,
          gameId,
          score: finalScore,
          xpEarned: totalEarnedXp,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isNewBest,
        };

        return {
          ...prev,
          xp: prev.xp + totalEarnedXp,
          totalGamesPlayed: nextTotalPlayed,
          highScores: nextHighScores,
          playCounts: nextPlayCounts,
          unlockedAchievements: [
            ...prev.unlockedAchievements,
            ...newlyUnlocked.map((a) => a.id),
          ],
          recentMatches: [matchEntry, ...prev.recentMatches.slice(0, 9)],
        };
      });
    },
    []
  );

  const handleToggleSound = useCallback(() => {
    setProfile((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const handleUpdateCallsign = useCallback((callsign: string) => {
    setProfile((prev) => ({ ...prev, callsign }));
  }, []);

  const handleResetProgress = useCallback(() => {
    setProfile(INITIAL_PROFILE);
  }, []);

  const handleSelectNavCategory = (cat: GameCategory) => {
    setActiveGameId(null);
    setSelectedCategory(cat);
    const catalogEl = document.getElementById('arcade-catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderActiveCabinet = () => {
    if (!activeGameId || !activeGameMeta) return null;
    const commonProps = {
      highScore: profile.highScores[activeGameId] || 0,
      soundEnabled: profile.soundEnabled,
      onGameOver: (score: number) => handleRecordGameResult(activeGameId, score),
      onExit: () => setActiveGameId(null),
      onToggleSound: handleToggleSound,
    };

    switch (activeGameId) {
      case 'turbo-outrun':
        return <TurboOutrunGame {...commonProps} />;
      case 'starfighter-nova':
        return <StarfighterNovaGame {...commonProps} />;
      case 'bastion-grid':
        return <BastionGridGame {...commonProps} />;
      case 'neon-viper':
        return <NeonViperGame {...commonProps} />;
      case 'quantum-breaker':
        return <QuantumBreakerGame {...commonProps} />;
      case 'pulse-runner':
        return <PulseRunnerGame {...commonProps} />;
      case 'logic-2048':
        return <Logic2048Game {...commonProps} />;
      case 'memory-matrix':
        return <MemoryMatrixGame {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
      {/* Strict 3-Zone Top Navigation Bar Contract */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-4 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveGameId(null);
            setSelectedCategory('all');
          }}
          className="text-xl font-bold font-display tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
        >
          Nexus Arcade
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a
            href="#arcade-catalog"
            onClick={(e) => {
              e.preventDefault();
              handleSelectNavCategory('all');
            }}
            className="hover:text-cyan-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            All Games
          </a>
          <a
            href="#arcade-catalog"
            onClick={(e) => {
              e.preventDefault();
              handleSelectNavCategory('action-racing');
            }}
            className="hover:text-cyan-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Action & Racing
          </a>
          <a
            href="#arcade-catalog"
            onClick={(e) => {
              e.preventDefault();
              handleSelectNavCategory('arcade-classics');
            }}
            className="hover:text-cyan-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Arcade Classics
          </a>
          <a
            href="#arcade-catalog"
            onClick={(e) => {
              e.preventDefault();
              handleSelectNavCategory('strategy-puzzle');
            }}
            className="hover:text-cyan-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Strategy & Puzzle
          </a>
          <a
            href="#leaderboards"
            onClick={(e) => {
              e.preventDefault();
              setActiveGameId(null);
              setTimeout(() => {
                document.getElementById('leaderboards')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            className="hover:text-cyan-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Leaderboards
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Arcade Profile
          </button>
        </div>
      </header>

      {/* Achievement Toast Notification */}
      {unlockedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-400 rounded-xl p-4 shadow-2xl flex items-center gap-3 max-w-sm">
          <Award className="w-8 h-8 text-amber-400 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-cyan-400">
              Achievement Unlocked · +{unlockedToast.xpReward} XP
            </div>
            <div className="text-sm font-bold text-white">{unlockedToast.title}</div>
            <div className="text-xs text-slate-400">{unlockedToast.description}</div>
          </div>
        </div>
      )}

      {/* Main Content Router: Active Game Cabinet vs. Arcade Hub Storefront */}
      {activeGameId && activeGameMeta ? (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
          {/* Cabinet Top Control Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveGameId(null)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Hub
              </button>
              <div>
                <h1 className="text-xl font-bold font-display text-white">
                  {activeGameMeta.title}
                </h1>
                <div className="text-xs text-slate-400">
                  {activeGameMeta.categoryLabel} · {activeGameMeta.subtitle}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleSound}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                {profile.soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    Sound On
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-500" />
                    Sound Muted
                  </>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-2 text-xs font-mono tabular-nums text-slate-400 bg-slate-900/70 border border-slate-800 px-3 py-2 rounded-lg">
                <span>{profile.callsign}</span>
                <span>·</span>
                <span className="text-cyan-400">Lv.{levelInfo.level}</span>
                <span>·</span>
                <span className="text-amber-400">{profile.xp.toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          {/* Active Game Engine Viewport */}
          {renderActiveCabinet()}

          {/* Cabinet Controls & Rules Guide Below Canvas */}
          <div className="max-w-[700px] mx-auto mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-[#111827] border border-slate-800/90 rounded-xl">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Keyboard className="w-4 h-4 text-cyan-400" />
                Cabinet Controls
              </h3>
              <div className="space-y-2">
                {activeGameMeta.controlsDetailed.map((ctrl, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs border-b border-slate-800/60 pb-1.5"
                  >
                    <span className="font-mono text-cyan-300">{ctrl.keys}</span>
                    <span className="text-slate-300">{ctrl.action}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Gamepad2 className="w-4 h-4 text-pink-400" />
                Tactical Briefing & Scoring
              </h3>
              <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                {activeGameMeta.rulesSummary.map((rule, idx) => (
                  <li key={idx}>
                    {idx + 1}. {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick-Switch Other Cabinets Strip */}
          <div className="max-w-[700px] mx-auto mt-6 pt-6 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 mb-3">
              Quick-Switch Arcade Cabinet
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {GAMES_CATALOG.filter((g) => g.id !== activeGameId)
                .slice(0, 4)
                .map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setActiveGameId(g.id)}
                    className="p-2.5 bg-[#111827] hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors"
                  >
                    <div className="text-xs font-semibold text-white truncate">
                      {g.title}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                      Best: {(profile.highScores[g.id] || 0).toLocaleString()}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </main>
      ) : (
        <main id="top" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-14">
          {/* Section 1: Featured Hero Spotlight + Full-Width Telemetry Bar */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden">
              {/* Left Copy Column */}
              <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-cyan-400 font-medium">
                    Featured Cabinet · Action & Racing · 60 FPS Canvas Engine
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-bold font-display text-white tracking-tight mt-3">
                    Eight Instant-Play Cyber Arcade Cabinets. One Unified Profile.
                  </h1>
                  <p className="text-base text-slate-300 mt-4 max-w-2xl leading-relaxed">
                    Jump straight into high-speed midnight highway racing in{' '}
                    <span className="text-white font-medium">Turbo Outrun 2099</span>, pilot orbital interceptors in{' '}
                    <span className="text-white font-medium">Starfighter Nova</span>, command perimeter turrets in{' '}
                    <span className="text-white font-medium">Bastion Grid</span>, or master 5 more arcade & strategy titles. Every run earns XP toward your global rank.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-8">
                  <button
                    onClick={() => setActiveGameId('turbo-outrun')}
                    className="px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Play Turbo Outrun 2099
                  </button>
                  <button
                    onClick={() => setActiveGameId('starfighter-nova')}
                    className="px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 font-medium text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    Launch Starfighter Nova
                  </button>
                </div>
              </div>

              {/* Right Visual Preview Column */}
              <div
                onClick={() => setActiveGameId('turbo-outrun')}
                className="lg:col-span-5 relative min-h-[260px] cursor-pointer group overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-800"
              >
                <GameArtwork
                  gameId="turbo-outrun"
                  className="lg:h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex flex-col justify-end p-6">
                  <div className="text-xs text-cyan-300 font-mono tabular-nums">
                    Spotlight · Personal Best: {(profile.highScores['turbo-outrun'] || 0).toLocaleString()}
                  </div>
                  <div className="text-xl font-bold font-display text-white mt-0.5">
                    Turbo Outrun 2099 — Highway Overdrive
                  </div>
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Player Progression Strip Below Hero Split */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="p-4 bg-[#111827] border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Player Callsign & Rank</div>
                <div className="text-lg font-bold font-display text-white mt-1 truncate">
                  {profile.callsign} · Lv.{levelInfo.level}
                </div>
                <div className="text-xs text-cyan-400 mt-0.5">{levelInfo.rankTitle}</div>
              </div>

              <div className="p-4 bg-[#111827] border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Experience Points</div>
                <div className="text-lg font-bold font-mono tabular-nums text-amber-400 mt-1">
                  {profile.xp.toLocaleString()} XP
                </div>
                <div className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                  {levelInfo.nextLevelXp - levelInfo.currentLevelXp} XP to Level {levelInfo.level + 1}
                </div>
              </div>

              <div className="p-4 bg-[#111827] border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Unlocked Achievements</div>
                <div className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-1">
                  {profile.unlockedAchievements.length} / {ACHIEVEMENTS.length}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Cross-Cabinet Badges
                </div>
              </div>

              <div className="p-4 bg-[#111827] border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Combined High Score</div>
                <div className="text-lg font-bold font-mono tabular-nums text-pink-400 mt-1">
                  {Object.values(profile.highScores)
                    .reduce((acc, v) => acc + v, 0)
                    .toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                  Across {profile.totalGamesPlayed} Completed Sessions
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Interactive Game Catalog (Filter Tabs + Search + 8-Game Grid) */}
          <section id="arcade-catalog" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-display text-white">
                  01. Playable Arcade Library
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Select any cabinet to launch immediately with keyboard, mouse, or touch controls.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Interactive Segmented Category Filter Buttons */}
                <div className="flex items-center gap-1 p-1 bg-[#111827] border border-slate-800 rounded-lg">
                  {(
                    [
                      { id: 'all', label: 'All Games (8)' },
                      { id: 'action-racing', label: 'Action & Racing' },
                      { id: 'arcade-classics', label: 'Arcade Classics' },
                      { id: 'strategy-puzzle', label: 'Strategy & Puzzle' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedCategory(tab.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategory === tab.id
                          ? 'bg-cyan-400 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter games..."
                    className="pl-9 pr-3 py-1.5 bg-[#111827] border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 w-44"
                  />
                </div>
              </div>
            </div>

            {/* 8-Game Bento Grid */}
            {filteredGames.length === 0 ? (
              <div className="p-12 bg-[#111827] border border-slate-800 rounded-2xl text-center">
                <p className="text-sm text-slate-300">
                  No arcade cabinets match "{searchQuery}".
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-lg"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredGames.map((game) => {
                  const personalBest = profile.highScores[game.id] || 0;
                  const plays = profile.playCounts[game.id] || 0;

                  return (
                    <div
                      key={game.id}
                      onClick={() => setActiveGameId(game.id)}
                      className="group bg-[#111827] border border-slate-800/90 hover:border-cyan-500/60 rounded-xl overflow-hidden flex flex-col justify-between cursor-pointer transition-transform duration-150 hover:-translate-y-1"
                    >
                      <div>
                        {/* Card Artwork */}
                        <div className="aspect-[16/9] w-full overflow-hidden border-b border-slate-800/80 bg-slate-950">
                          <GameArtwork
                            gameId={game.id}
                            className="group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>

                        {/* Card Content — Zero-Pill Unboxed Metadata */}
                        <div className="p-5">
                          <div className="text-xs text-slate-400">
                            <span>{game.categoryLabel}</span>
                            <span aria-hidden="true"> · </span>
                            <span className="font-mono tabular-nums text-cyan-400">
                              Best: {personalBest.toLocaleString()}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold font-display text-white mt-1.5 group-hover:text-cyan-300 transition-colors">
                            {game.title}
                          </h3>

                          <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                            {game.description}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 truncate">
                          {game.controlsShort} · {plays} {plays === 1 ? 'Play' : 'Plays'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveGameId(game.id);
                          }}
                          className="px-3.5 py-1.5 bg-cyan-500/15 group-hover:bg-cyan-400 text-cyan-300 group-hover:text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Play Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 3: Personal High-Score Standings & Achievements Showcase */}
          <section id="leaderboards" className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
            {/* High-Score Standings Table */}
            <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    02. Cabinet High-Score Standings
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your personal record book and play activity across all 8 Nexus cabinets.
                  </p>
                </div>
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Full Profile
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                      <th className="py-2.5 pr-4 font-medium">Arcade Cabinet</th>
                      <th className="py-2.5 px-4 font-medium">Genre</th>
                      <th className="py-2.5 px-4 font-medium text-right">Runs</th>
                      <th className="py-2.5 pl-4 font-medium text-right">High Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {GAMES_CATALOG.map((g) => {
                      const best = profile.highScores[g.id] || 0;
                      const runs = profile.playCounts[g.id] || 0;
                      return (
                        <tr
                          key={g.id}
                          onClick={() => setActiveGameId(g.id)}
                          className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                        >
                          <td className="py-3 pr-4 font-semibold text-white">
                            {g.title}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {g.categoryLabel}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                            {runs}
                          </td>
                          <td className="py-3 pl-4 text-right font-mono tabular-nums font-bold text-cyan-400">
                            {best.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Achievements & Recent Sessions Column */}
            <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-5">
                  <div>
                    <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-cyan-400" />
                      03. Challenge Milestones
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Complete score targets to unlock bonus Arcade XP.
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-cyan-400">
                    {profile.unlockedAchievements.length}/{ACHIEVEMENTS.length} Unlocked
                  </span>
                </div>

                <div className="space-y-3">
                  {ACHIEVEMENTS.slice(0, 6).map((ach) => {
                    const unlocked = profile.unlockedAchievements.includes(ach.id);
                    return (
                      <div
                        key={ach.id}
                        className={`p-3.5 rounded-xl border ${
                          unlocked
                            ? 'bg-cyan-950/25 border-cyan-500/40'
                            : 'bg-slate-950/50 border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-white">
                            {ach.title}
                          </span>
                          <span className="text-[11px] font-mono tabular-nums text-amber-400">
                            +{ach.xpReward} XP · {unlocked ? 'COMPLETE' : 'IN PROGRESS'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {ach.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-full mt-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-cyan-300 rounded-lg transition-colors"
              >
                View All {ACHIEVEMENTS.length} Achievements & Match Log
              </button>
            </div>
          </section>
        </main>
      )}

      {/* Clean Minimal Footer */}
      <footer className="mt-16 border-t border-slate-800/80 py-6 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>Nexus Arcade — Instant-Play Web Gaming Hub</div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveGameId(null)}
              className="hover:text-slate-300 transition-colors"
            >
              Game Catalog
            </button>
            <span>·</span>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Arcade Profile
            </button>
            <span>·</span>
            <button
              onClick={handleToggleSound}
              className="hover:text-slate-300 transition-colors"
            >
              {profile.soundEnabled ? 'Mute Audio' : 'Enable Audio'}
            </button>
          </div>
        </div>
      </footer>

      {/* Profile Modal */}
      {isProfileOpen && (
        <ProfileModal
          profile={profile}
          onClose={() => setIsProfileOpen(false)}
          onUpdateCallsign={handleUpdateCallsign}
          onToggleSound={handleToggleSound}
          onResetProgress={handleResetProgress}
          onLaunchGame={(gameId) => setActiveGameId(gameId)}
        />
      )}
    </div>
  );
}
