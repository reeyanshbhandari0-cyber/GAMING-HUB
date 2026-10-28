import React, { useState, useCallback, useEffect } from 'react';
import { GameProps, GameState } from '../types/arcade';
import { soundFX } from '../utils/sound';
import { Play, RotateCcw, Cpu } from 'lucide-react';

interface CipherCard {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

const GLYPHS = ['Δ', 'Ω', 'Ψ', 'Σ', 'Φ', 'Λ', 'Θ', 'Ξ'];

export const MemoryMatrixGame: React.FC<GameProps> = ({
  highScore,
  onGameOver,
}) => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [protocol, setProtocol] = useState<'SEQUENCE' | 'CIPHER_PAIRS'>('SEQUENCE');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);

  // Sequence mode state
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState(0);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState(false);

  // Cipher Pairs state
  const [cards, setCards] = useState<CipherCard[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [streak, setStreak] = useState(1);

  const playSequence = useCallback((seq: number[]) => {
    setIsShowingSequence(true);
    seq.forEach((nodeIdx, i) => {
      setTimeout(() => {
        setActiveNode(nodeIdx);
        soundFX.playMemoryNote(nodeIdx);
      }, (i + 1) * 520);
      setTimeout(() => {
        setActiveNode(null);
        if (i === seq.length - 1) {
          setIsShowingSequence(false);
        }
      }, (i + 1) * 520 + 340);
    });
  }, []);

  const startCalibration = useCallback(() => {
    setScore(0);
    setRound(1);
    setGameState('PLAYING');

    if (protocol === 'SEQUENCE') {
      const first = Math.floor(Math.random() * 9);
      const second = Math.floor(Math.random() * 9);
      const initialSeq = [first, second];
      setSequence(initialSeq);
      setUserStep(0);
      playSequence(initialSeq);
    } else {
      const deck = [...GLYPHS, ...GLYPHS]
        .sort(() => Math.random() - 0.5)
        .map((symbol, id) => ({
          id,
          symbol,
          flipped: false,
          matched: false,
        }));
      setCards(deck);
      setSelectedIndices([]);
      setStreak(1);
      soundFX.playBoost();
    }
  }, [protocol, playSequence]);

  const handleSequenceNodeClick = (idx: number) => {
    if (gameState !== 'PLAYING' || isShowingSequence) return;
    soundFX.playMemoryNote(idx);
    setActiveNode(idx);
    setTimeout(() => setActiveNode(null), 200);

    if (sequence[userStep] === idx) {
      const nextStep = userStep + 1;
      const nextScore = score + 120 * round;
      setScore(nextScore);

      if (nextStep === sequence.length) {
        // Completed pattern! Advance round
        const nextRound = round + 1;
        setRound(nextRound);
        setUserStep(0);
        const nextSeq = [...sequence, Math.floor(Math.random() * 9)];
        setSequence(nextSeq);
        setTimeout(() => playSequence(nextSeq), 450);
      } else {
        setUserStep(nextStep);
      }
    } else {
      soundFX.playGameOver();
      setGameState('GAME_OVER');
      onGameOver(score, `Sequence Round ${round}`);
    }
  };

  const handleCardClick = (idx: number) => {
    if (
      gameState !== 'PLAYING' ||
      selectedIndices.length >= 2 ||
      cards[idx].flipped ||
      cards[idx].matched
    ) {
      return;
    }

    soundFX.playMemoryNote(idx);
    const updated = cards.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
    setCards(updated);
    const nextSel = [...selectedIndices, idx];
    setSelectedIndices(nextSel);

    if (nextSel.length === 2) {
      const [firstIdx, secondIdx] = nextSel;
      if (updated[firstIdx].symbol === updated[secondIdx].symbol) {
        soundFX.playPickup();
        const nextScore = score + 220 * streak;
        const nextStreak = streak + 1;
        setScore(nextScore);
        setStreak(nextStreak);

        const matchedDeck = updated.map((c, i) =>
          i === firstIdx || i === secondIdx ? { ...c, matched: true } : c
        );
        setCards(matchedDeck);
        setSelectedIndices([]);

        if (matchedDeck.every((c) => c.matched)) {
          const finalBonus = nextScore + 500;
          setScore(finalBonus);
          soundFX.playAchievement();
          setGameState('GAME_OVER');
          onGameOver(finalBonus, 'Cipher Decrypted');
        }
      } else {
        setStreak(1);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, flipped: false } : c
            )
          );
          setSelectedIndices([]);
        }, 650);
      }
    }
  };

  useEffect(() => {
    return () => {
      setIsShowingSequence(false);
    };
  }, []);

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
            <div className="text-[11px] text-slate-400">Status</div>
            <div className="text-sm font-bold font-mono tabular-nums text-emerald-400 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" />
              {protocol === 'SEQUENCE'
                ? isShowingSequence
                  ? `Watch Pattern (${sequence.length} Nodes)`
                  : `Your Turn (${userStep}/${sequence.length})`
                : `${streak}x Match Streak`}
            </div>
          </div>
        </div>

        <button
          onClick={startCalibration}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          Restart
        </button>
      </div>

      {/* Main Puzzle Container */}
      <div className="relative w-full max-w-[700px] min-h-[480px] bg-[#08101D] border-x border-b border-slate-800 rounded-b-xl p-6 flex flex-col items-center justify-center">
        {protocol === 'SEQUENCE' ? (
          <div className="grid grid-cols-3 gap-4 w-full max-w-[330px] aspect-square">
            {Array.from({ length: 9 }).map((_, idx) => {
              const lit = activeNode === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSequenceNodeClick(idx)}
                  disabled={isShowingSequence || gameState !== 'PLAYING'}
                  className={`rounded-2xl border-2 font-mono font-bold text-xl transition-all duration-150 ${
                    lit
                      ? 'bg-cyan-400 border-white text-slate-950 scale-95 shadow-lg'
                      : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  0{idx + 1}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 w-full max-w-[360px] aspect-square">
            {cards.map((card, idx) => {
              const revealed = card.flipped || card.matched;
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  className={`rounded-xl border-2 font-mono font-bold text-2xl flex items-center justify-center transition-all duration-150 ${
                    card.matched
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                      : revealed
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-600'
                  }`}
                >
                  {revealed ? card.symbol : '?'}
                </button>
              );
            })}
          </div>
        )}

        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-b-xl">
            <h2 className="text-3xl font-bold font-display text-white">Memory Matrix</h2>
            <p className="text-sm text-slate-300 max-w-md mt-2">
              Select a neural recall protocol: Sequence Recall (repeat expanding 9-node light sequences) or Cipher Match (decrypt paired cyber-glyphs with streak multipliers).
            </p>
            <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg mt-5">
              <button
                onClick={() => setProtocol('SEQUENCE')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  protocol === 'SEQUENCE'
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sequence Recall
              </button>
              <button
                onClick={() => setProtocol('CIPHER_PAIRS')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  protocol === 'CIPHER_PAIRS'
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cipher Pair Match
              </button>
            </div>
            <button
              onClick={startCalibration}
              className="mt-6 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Game
            </button>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-b-xl">
            <h3 className="text-3xl font-bold font-display text-white">Calibration Complete</h3>
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
              onClick={startCalibration}
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
