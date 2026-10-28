# NEXUS ARCADE — All-in-One Cyberpunk Gaming Hub

NEXUS ARCADE is a unified web gaming platform that brings together 8 complete, instant-play arcade games—spanning high-speed highway racing, space combat, tactical defense, platforming, classic arcade action, and logic puzzles—unified by a persistent player progression system with XP levels, unlockable achievements, synthesized arcade sound effects, and per-game high scores.

## User Review & Critical Decisions

> [!IMPORTANT]
> All core scope and design choices have been aligned based on your selections. Review the game lineup and unified progression architecture below before we build the portal.

- **Confirmed Game Lineup (8 Playable Games)**:
  1. **Turbo Outrun 2099 (Racing)**: Pseudo-3D multi-lane neon highway racer with nitro boost, slipstream combos, oncoming traffic dodging, and dynamic speed scaling.
  2. **Starfighter Nova (Space Shooter)**: Vertical bullet-hell space shooter with wave formations, boss encounters, weapon power-ups (Spread, Laser, Shield), and particle explosions.
  3. **Bastion Grid (Tactical Tank & Tower Defense)**: Top-down tactical arena where you pilot a defense tank and deploy automated laser/plasma turrets to protect the central core against enemy waves.
  4. **Neon Viper (Cyber Snake)**: High-speed grid snake with combo multipliers, warp portals, speed-boost orbs, and dynamic obstacle walls.
  5. **Quantum Breaker (Brick Breaker & Pong Arena)**: Dual-mode arcade cabinet featuring multi-ball power-up Brick Breaker and an AI-opponent Cyber Pong Arena.
  6. **Pulse Runner (Endless Platformer)**: Side-scrolling cyberpunk rooftop & hazard runner with double-jumping, dash mechanics, and laser barriers.
  7. **2048 Logic Core (Number Strategy Puzzle)**: Smooth sliding-tile cyber-matrix puzzle with undo support, move efficiency tracking, and combo synthesis.
  8. **Memory Matrix (Pattern & Recall Puzzle)**: Progressive neural-grid pattern & symbol recall challenge with streak multipliers and time-attack rounds.
- **Confirmed Visual Aesthetic**: **Neon Cyberpunk Arcade** with deep obsidian-slate surfaces, electric cyan and magenta accents, crisp HUD readouts, and tabular numerals—crafted with clean typography and zero decorative clutter.
- **Confirmed Progression System**: **Unified Arcade Profile** with persistent XP leveling, cross-game achievement badges, global & per-game personal best leaderboards, and synthesized Web Audio API arcade sound effects with a master mute toggle.

---

## 1. Overview & Core Concept

- **What It Does**: Provides an instant-load arcade storefront and game launcher where players can browse games by genre, launch into a dedicated full-focus arcade cabinet view with live HUD telemetry, earn XP and achievements for every match played, and track their high scores across all 8 titles.
- **Target Audience / Persona**: Casual and core web gamers looking for a responsive, zero-install collection of action, racing, strategy, and puzzle games with rewarding progression.
- **Key Value**: Every game is built with a complete state machine (`TITLE_MENU` → `PLAYING` → `PAUSED` → `GAME_OVER`), responsive keyboard and mouse/touch controls, 60fps HTML5 Canvas / interactive rendering, and real-time audio feedback.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Storefront & Discovery Flow**: User lands on the NEXUS ARCADE hub featuring a spotlight hero banner for *Turbo Outrun 2099*, a genre filter bar (`All Games`, `Action & Racing`, `Arcade Classics`, `Strategy & Puzzle`), a search input, and an 8-card game grid displaying personal high scores and play counts.
  2. **Active Cabinet Gameplay Flow**: Selecting any game opens the interactive Arcade Cabinet View with an unobtrusive top HUD bar (`Score`, `High Score`, `Level / Wave`, `HP / Lives`, plus `Pause`, `Restart`, `Sound Toggle`, and `Exit to Hub` controls), a clear control keybind legend below the canvas, and full keyboard/mouse focus management.
  3. **Post-Game Progression & Achievement Flow**: Finishing a run presents the Game Over / Victory summary with final score, new personal best celebration, XP earned toward the next Arcade Rank, newly unlocked Achievements toast notification, and a single-click `"Play Again"` button.
  4. **Profile & Achievements Modal**: Clicking `"Arcade Profile"` in the top navigation bar opens a comprehensive progression drawer showing the player's rank, XP progress bar, unlocked achievements across games, and a unified high-score table.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-contrast Cyberpunk Arcade Cabinet meets precision Next-Gen Console Hub.
  - *Color Palette & Mood (60-30-10 Discipline)*:
    - **60% Dominant Canvas**: Deep obsidian slate (`#0B0F19`) and midnight surface (`#111827`).
    - **30% Structural Surfaces**: Elevated slate containers (`#1E293B`) with crisp `1px solid rgba(255, 255, 255, 0.08)` hairline borders and muted cool-grey prose (`#94A3B8`).
    - **10% Focal Accents**: Electric cyan (`#06B6D4`) for primary interactive actions, neon magenta (`#EC4899`) for high-intensity combat/boost states, and amber (`#F59E0B`) for high-score crowns and XP level-ups.
  - *Typography & Hierarchy (2+1 Font Rule)*:
    - **Display / Headers**: `Outfit` (SemiBold/Bold 600–700) with `text-wrap: balance` for bold arcade cabinet titles and section headers.
    - **Body / UI Controls**: `Plus Jakarta Sans` (Regular 400 / Medium 500) for clean readability.
    - **Scoreboards & HUD Telemetry**: `JetBrains Mono` with `tabular-nums` for live score counters, timers, speedometers, and leaderboard tables.
  - *Component Styling & Layout*:
    - Full 1440px desktop layout with a strict 3-zone top navigation bar (`NEXUS ARCADE` wordmark — genre quick-nav links — `Arcade Profile` primary button).
    - Metadata on game cards (Genre · Controls · Personal Best) rendered as clean unboxed inline text separated by `·` bullets.

- **Interactive Feedback & Motion**:
  - Fast $\le 200\text{ms}$ button and card hover transitions using compositor-only `transform` and `opacity`.
  - Built-in Web Audio API synthesizer generating retro-futuristic laser blasts, engine hums, tile merges, brick deflections, and achievement fanfare (with instant mute toggle).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dedicated 60fps HTML5 Canvas Engines for Action Games + Reactive DOM Grids for Puzzles**
  - *Chosen Approach*: Use custom `requestAnimationFrame` HTML5 Canvas engines with delta-time physics for the 6 real-time action/arcade games (*Turbo Outrun*, *Starfighter Nova*, *Bastion Grid*, *Neon Viper*, *Quantum Breaker*, *Pulse Runner*) and hardware-accelerated CSS grid boards for *2048 Logic Core* and *Memory Matrix*.
  - *Why*: Guarantees smooth collision detection, particle bursts, and zero React re-render lag during intense 60fps gameplay while giving puzzle games crisp accessible button targets ($\ge 44\text{px}$).
  - *Alternatives Considered*: Pure DOM rendering for action games (causes layout thrashing) or heavy external 3D game engines (bloats bundle size and slows instant game switching).

- **Decision 2: Unified Client-Side Progression & Web Audio Synthesizer**
  - *Chosen Approach*: Persist player XP, level rank, play history, per-game high scores, and 16 unlockable achievements in structured `localStorage`, paired with a zero-dependency Web Audio API sound synthesizer.
  - *Why*: Works instantaneously offline and across reloads without external audio asset loading failures or mandatory account sign-up walls.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        NEXUS ARCADE APPLICATION SHELL                      │
│  ┌──────────────────────┐  ┌─────────────────────────┐  ┌───────────────┐  │
│  │  Top Navigation Bar  │  │  Progression & Audio    │  │ Achievement   │  │
│  │  (3-Zone Contract)   │  │  Context (localStorage) │  │ Toast Overlay │  │
│  └──────────┬───────────┘  └────────────┬────────────┘  └───────▲───────┘  │
└─────────────┼───────────────────────────┼───────────────────────┼──────────┘
              │                           │                       │
      ┌───────▼───────────────────────────▼───────┐               │
      │          VIEW ROUTER & STATE              │               │
      │  Active View: HUB_STOREFRONT | CABINET    │               │
      └───────┬───────────────────────────┬───────┘               │
              │                           │                       │
  ┌───────────▼───────────┐   ┌───────────▼───────────────────────┴──────────┐
  │    ARCADE HUB VIEW    │   │          ACTIVE GAME CABINET SHELL           │
  │ ┌───────────────────┐ │   │ ┌──────────────────────────────────────────┐ │
  │ │ Hero Spotlight    │ │   │ │ Unobtrusive HUD Bar (Score, Best, State) │ │
  │ ├───────────────────┤ │   │ ├──────────────────────────────────────────┤ │
  │ │ Category & Search │ │   │ │ Game State Machine Wrapper               │ │
  │ ├───────────────────┤ │   │ │ (TITLE_MENU | PLAYING | PAUSED | OVER)   │ │
  │ │ 8-Game Bento Grid │ │   │ ├──────────────────────────────────────────┤ │
  │ └───────────────────┘ │   │ │ Active Game Engine Canvas / Board:       │ │
  │                       │   │ │  • Turbo Outrun (Pseudo-3D Highway)      │ │
  │ ┌───────────────────┐ │   │ │  • Starfighter Nova (Space Shooter)      │ │
  │ │ Profile & Leader- │ │   │ │  • Bastion Grid (Tank & Tower Defense)   │ │
  │ │ board Drawer      │ │   │ │  • Neon Viper (Cyber Snake + Portals)    │ │
  │ └───────────────────┘ │   │ │  • Quantum Breaker (Breakout + Pong AI)  │ │
  └───────────────────────┘   │ │  • Pulse Runner (Endless Platformer)     │ │
                              │ │  • 2048 Logic Core & Memory Matrix       │ │
                              │ └──────────────────────────────────────────┘ │
                              └──────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `GameMetadata`: `{ id, title, subtitle, category, controlsText, description, difficulty, accentColor, thumbnailAsset }`
  - `PlayerProfile`: `{ xp, level, title, totalGamesPlayed, highScores: Record<GameId, number>, playCounts: Record<GameId, number>, unlockedAchievements: string[], soundEnabled: boolean }`
  - `Achievement`: `{ id, title, description, gameId, xpReward, condition(stats, score) }`

- **Interactive Component & State Mapping**:
  - **Hub Filter & Search Controls**: Clicking category tabs (`All`, `Action & Racing`, `Arcade Classics`, `Strategy & Puzzle`) or typing in the search bar immediately filters the displayed game catalog; clicking `"Launch Game"` transitions cleanly into the Cabinet View.
  - **Game Cabinet Lifecycle**: Every game implements `Start Game`, `Pause / Resume (P or Esc)`, `Restart Game`, `Difficulty / Mode Selector`, and `Exit to Hub`, properly cleaning up `requestAnimationFrame` loops and keyboard listeners on unmount.
  - **Score & XP Commit Pipeline**: Whenever a game reaches `GAME_OVER` or `ROUND_SUMMARY`, the cabinet dispatches `recordGameResult(gameId, score)` which updates personal bests, calculates earned XP, checks achievement unlock predicates, triggers synthesized audio fanfare, and displays an unlock notification if earned.
