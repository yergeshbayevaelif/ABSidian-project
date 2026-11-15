import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bus, Flame, Rocket } from 'lucide-react';
import { Language } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface LaunchAndFlightCinematicProps {
  language: Language;
  mode: 'bus_ride' | 'launch' | 'lunar_landing' | 'mars_landing' | 'return_earth';
  onComplete: () => void;
}

export const LaunchAndFlightCinematic: React.FC<LaunchAndFlightCinematicProps> = ({
  language,
  mode,
  onComplete,
}) => {
  const ru = language === 'ru';
  const [phase, setPhase] = useState(0);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (mode === 'launch') {
      if (countdown > 0) {
        const timer = window.setTimeout(() => {
          soundEngine.playDialogueBlip(440 + countdown * 80);
          setCountdown((c) => c - 1);
        }, 850);
        return () => clearTimeout(timer);
      } else if (phase === 0) {
        soundEngine.playRocketLaunch();
        setPhase(1);
      }
    }
  }, [mode, countdown, phase]);

  useEffect(() => {
    if (mode === 'launch' && phase === 0) return;
    const t1 = window.setTimeout(() => setPhase(2), 1900);
    const t2 = window.setTimeout(() => onComplete(), 4100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mode, phase, onComplete]);

  const titles = {
    bus_ride: ru
      ? [
          'Экипаж в скафандрах садится в автобус Astrovan...',
          'Автобус ABSIDIAN везёт котиков на Космодром 39А!',
          'Прибытие к стартовой площадке ракеты ABSIDIAN-1',
        ]
      : [
          'Crew in spacesuits boarding ABSIDIAN Astrovan...',
          'Driving across the causeway toward Spaceport Pad 39A!',
          'Arriving at Launchpad 39A — Rocket Ready!',
        ],
    launch: ru
      ? ['Обратный отсчёт на площадке 39А...', 'Зажигание! Ракета NASA ABSIDIAN стартует!', 'Отделение ступеней · Выход на орбиту Земли']
      : ['Launchpad 39A Countdown...', 'Liftoff! NASA ABSIDIAN Rocket Ascends!', 'Stage Separation · Earth Orbit Insertion'],
    lunar_landing: ru
      ? ['Снижение к кратеру Шеклтон...', 'Двигатели посадки включены', 'Касание поверхности Луны!']
      : ['Descending Toward Shackleton Crater...', 'Landing Thrusters Firing', 'Touchdown on the Lunar Surface!'],
    mars_landing: ru
      ? ['Вход в разрежённую атмосферу Марса...', 'Раскрытие парашюта и реактивная посадка', 'Добро пожаловать на Красную планету!']
      : ['Entering the Thin Martian Atmosphere...', 'Parachute & Retro-Propulsion Burn', 'Touchdown on Mars — Jezero Terrace!'],
    return_earth: ru
      ? ['Курс возвращения к Земле рассчитан...', 'Вход в атмосферу · Раскрытие парашютов', 'Экипаж ABSIDIAN вернулся домой!']
      : ['Return Trajectory Burn Complete...', 'Atmospheric Reentry · Chutes Deployed', 'ABSIDIAN Crew Safely Back on Earth!'],
  };

  const bgImage =
    mode === 'bus_ride'
      ? '/assets/aistudio/2026-11-15_10.05.57_d7541804.jpg'
      : mode === 'launch' || mode === 'return_earth'
      ? '/assets/aistudio/2026-11-15_10.05.22_db6b16da.jpg'
      : mode === 'lunar_landing'
      ? '/assets/aistudio/2026-11-15_10.04.57_e7de3db4.jpg'
      : '/assets/aistudio/2026-11-15_10.05.33_9817532e.jpg';

  const currentIdx = mode === 'launch' ? (countdown > 0 ? 0 : phase === 1 ? 1 : 2) : phase >= 2 ? 2 : 1;

  return (
    <div className="fixed inset-0 z-50 bg-[#04060c] flex flex-col items-center justify-center p-6 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-cover bg-center opacity-55"
        style={{ backgroundImage: `url(${bgImage})` }}
        animate={{ scale: [1, 1.08] }}
        transition={{ duration: 4.5, ease: 'easeOut' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#04060c] via-[#04060c]/50 to-[#04060c]/70" />

      <div className="relative z-10 text-center max-w-xl">
        {mode === 'launch' && countdown > 0 ? (
          <motion.div
            key={countdown}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-display text-8xl font-bold text-amber-400 mb-4"
          >
            T-{countdown}
          </motion.div>
        ) : (
          <motion.div
            animate={mode === 'bus_ride' ? { x: [-26, 26] } : { y: mode === 'launch' ? [-10, -40] : [0, 12] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatType: 'reverse' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 border border-amber-400/50 mb-6"
          >
            {mode === 'bus_ride' ? (
              <Bus className="w-10 h-10 text-amber-400" />
            ) : mode === 'launch' ? (
              <Flame className="w-10 h-10 text-amber-400" />
            ) : (
              <Rocket className="w-10 h-10 text-cyan-400" />
            )}
          </motion.div>
        )}

        <h2 className="font-display text-2xl md:text-4xl font-bold text-white mb-3">
          {titles[mode][currentIdx]}
        </h2>
        <p className="text-sm text-slate-300">
          {mode === 'bus_ride'
            ? ru
              ? 'Котики-астронавты в герметичных скафандрах едут по дороге к стартовому столу...'
              : 'Cat astronauts in full spacesuits riding the Astrovan crew bus to the launchpad...'
            : ru
            ? 'Космический корабль с эмблемой NASA следует по расчётной траектории...'
            : 'NASA-badged ABSIDIAN spacecraft following calculated orbital trajectory...'}
        </p>
      </div>
    </div>
  );
};
