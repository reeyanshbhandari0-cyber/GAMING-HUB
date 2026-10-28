import React, { useState } from 'react';
import { ACHIEVEMENTS, GAMES_CATALOG, getLevelInfo } from '../data/gamesCatalog';
import { GameId, PlayerProfile } from '../types/arcade';
import { X, Trophy, Award, Volume2, VolumeX, RotateCcw, Play } from 'lucide-react';

interface ProfileModalProps {
  profile: PlayerProfile;
  onClose: () => void;
  onUpdateCallsign: (callsign: string) => void;
  onToggleSound: () => void;
  onResetProgress: () => void;
  onLaunchGame: (gameId: GameId) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onClose,
  onUpdateCallsign,
  onToggleSound,
  onResetProgress,
  onLaunchGame,
}) => {
  const [editingName, setEditingName] = useState(profile.callsign);
  const [confirmReset, setConfirmReset] = useState(false);

  const levelInfo = getLevelInfo(profile.xp);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = editingName.trim().slice(0, 18) || 'PLAYER_ONE';
    onUpdateCallsign(cleaned);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#111827] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="text-xs text-cyan-400 font-medium">
              Rank {levelInfo.level} · {levelInfo.rankTitle}
            </div>
            <h2 className="text-2xl font-bold font-display text-white mt-1">
              Arcade Profile & Records
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close profile modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Callsign & Audio Controls + XP Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-800">
          <div>
            <form onSubmit={handleSaveName} className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1.5">
                  Player Callsign
                </label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  maxLength={18}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Save Callsign
              </button>
            </form>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={onToggleSound}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                {profile.soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    Arcade Audio: On
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-500" />
                    Arcade Audio: Muted
                  </>
                )}
              </button>

              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-800 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Data
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onResetProgress();
                      setConfirmReset(false);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-2.5 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg whitespace-nowrap shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Level {levelInfo.level} Progress</span>
              <span className="font-mono tabular-nums text-cyan-400">
                {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden my-3">
              <div
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
              <span>Total XP: {profile.xp.toLocaleString()}</span>
              <span>·</span>
              <span>Sessions: {profile.totalGamesPlayed}</span>
              <span>·</span>
              <span>
                Achievements: {profile.unlockedAchievements.length}/{ACHIEVEMENTS.length}
              </span>
            </div>
          </div>
        </div>

        {/* High Score Table */}
        <div className="py-6 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-400" />
            Personal Best High Scores
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GAMES_CATALOG.map((g) => {
              const best = profile.highScores[g.id] || 0;
              const plays = profile.playCounts[g.id] || 0;
              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-100">{g.title}</div>
                    <div className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                      Best: {best.toLocaleString()} · {plays} {plays === 1 ? 'Run' : 'Runs'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onLaunchGame(g.id);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Play
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements List */}
        <div className="pt-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-cyan-400" />
            Arcade Achievements ({profile.unlockedAchievements.length} / {ACHIEVEMENTS.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = profile.unlockedAchievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`p-3 rounded-xl border ${
                    unlocked
                      ? 'bg-cyan-950/25 border-cyan-500/40'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{ach.title}</span>
                    <span className="text-[11px] font-mono tabular-nums text-amber-400">
                      +{ach.xpReward} XP · {unlocked ? 'UNLOCKED' : 'LOCKED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{ach.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
