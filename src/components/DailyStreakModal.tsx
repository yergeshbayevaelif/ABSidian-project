import React from 'react';
import { Check, Coins, Flame, Gift, Sparkles, X } from 'lucide-react';
import { Language } from '../types/game';
import { STREAK_REWARDS, StreakRewardDay } from '../data/shopAndRewards';
import { soundEngine } from '../audio/soundEngine';

interface DailyStreakModalProps {
  language: Language;
  streakDays: number;
  canClaimToday: boolean;
  onClaimReward: (reward: StreakRewardDay) => void;
  onClose: () => void;
}

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({
  language,
  streakDays,
  canClaimToday,
  onClaimReward,
  onClose,
}) => {
  const ru = language === 'ru';
  const currentCycleIndex = streakDays % 7; // 0..6
  const nextReward = STREAK_REWARDS[currentCycleIndex];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#090e1a] border-2 border-amber-500/60 rounded-2xl p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center">
              <Flame className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-white">
                {ru ? 'Ежедневные подарки и Стрик' : 'Daily Streak Rewards Calendar'}
              </h3>
              <p className="text-xs text-amber-300 font-mono-tabular">
                {ru
                  ? `Твой текущий стрик: ${streakDays} дн. Заходи каждый день за подарками и скинами!`
                  : `Current Login Streak: ${streakDays} day(s) — Claim daily coins, science & cosmetics!`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 7-Day Brawl-Stars-Style Gift Track */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {STREAK_REWARDS.map((item, idx) => {
            const isClaimed = idx < currentCycleIndex || (!canClaimToday && idx === (currentCycleIndex === 0 && streakDays > 0 ? 6 : currentCycleIndex - 1));
            const isToday = canClaimToday && idx === currentCycleIndex;
            return (
              <div
                key={item.day}
                className={`relative rounded-xl p-3 border-2 flex flex-col items-center text-center transition-all ${
                  item.isMega
                    ? 'bg-gradient-to-b from-amber-950/80 to-purple-950/70'
                    : 'bg-slate-950'
                } ${
                  isToday
                    ? 'border-amber-400 ring-2 ring-amber-400/40 scale-[1.03]'
                    : isClaimed
                    ? 'border-emerald-500/70 opacity-80'
                    : 'border-slate-800'
                }`}
              >
                <div className="text-[11px] font-bold uppercase text-slate-400 mb-1">
                  {ru ? `День ${item.day}` : `Day ${item.day}`}
                </div>

                <div className="w-11 h-11 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center my-1.5">
                  {isClaimed ? (
                    <Check className="w-6 h-6 text-emerald-400" />
                  ) : item.bonusDecoration || item.bonusSkin ? (
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  ) : (
                    <Gift className="w-6 h-6 text-cyan-400" />
                  )}
                </div>

                <div className="font-mono-tabular font-bold text-sm text-amber-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  +{item.coins}
                </div>
                <div className="text-[10px] text-cyan-300 mt-0.5">+{item.science} SCI</div>
                {(item.bonusDecoration || item.bonusSkin) && (
                  <div className="mt-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[9px] font-bold">
                    {ru ? '+ СКИН/УКРАШЕНИЕ' : '+ BONUS SKIN'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Claim Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-300">
            {canClaimToday ? (
              <span className="text-emerald-300 font-semibold">
                {ru
                  ? `Сегодня доступен подарок: ${nextReward.titleRu} (+${nextReward.coins} монет)!`
                  : `Today’s reward ready: ${nextReward.titleEn} (+${nextReward.coins} Coins)!`}
              </span>
            ) : (
              <span className="text-slate-400">
                {ru
                  ? 'Сегодняшний подарок уже получен! Возвращайся завтра, чтобы не сбить стрик.'
                  : 'Today’s reward has already been claimed! Come back tomorrow to keep your streak.'}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!canClaimToday}
            onClick={() => {
              soundEngine.playSuccess();
              onClaimReward(nextReward);
            }}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm whitespace-nowrap shadow-lg"
          >
            {canClaimToday
              ? ru
                ? `Забрать подарок (+${nextReward.coins} 🪙)`
                : `Claim Gift (+${nextReward.coins} Coins)`
              : ru
              ? 'Получено сегодня ✓'
              : 'Claimed Today ✓'}
          </button>
        </div>
      </div>
    </div>
  );
};
