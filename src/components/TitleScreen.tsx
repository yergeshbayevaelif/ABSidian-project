import React from 'react';
import { motion } from 'motion/react';
import { Globe, Play, RotateCcw, Rocket, Settings, Users } from 'lucide-react';
import { Language } from '../types/game';
import { t } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

interface TitleScreenProps {
  language: Language;
  hasSave: boolean;
  onChangeLanguage: (lang: Language) => void;
  onStartAdventure: () => void;
  onPlayWithFriends: () => void;
  onContinue: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  language,
  hasSave,
  onChangeLanguage,
  onStartAdventure,
  onPlayWithFriends,
  onContinue,
  onOpenSettings,
}) => {
  const txt = t(language);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#04060d] flex flex-col justify-between p-6 md:p-12 select-none">
      {/* Full-Bleed Cosmic Nebula Backdrop */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: 'url(/assets/aistudio/2026-11-15_10.05.57_d7541804.jpg)' }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Atmospheric Horizon Planet & Gravitational Singularity Glow (no hard square edges!) */}
      <div
        className="pointer-events-none absolute -right-[14%] -bottom-[26%] w-[520px] h-[520px] md:w-[760px] md:h-[760px] rounded-full opacity-85"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, rgba(56,189,248,0.55) 0%, rgba(29,78,216,0.45) 38%, rgba(15,23,42,0.92) 68%, rgba(4,6,13,0) 74%)',
          boxShadow: 'inset -40px -40px 90px rgba(0,0,0,0.85), 0 0 110px rgba(56,189,248,0.22)',
        }}
      >
        <img
          src="/assets/aistudio/2026-11-15_10.06.03_1685d2f3.jpg"
          alt="Earth"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-full opacity-75 mix-blend-screen"
          style={{
            maskImage: 'radial-gradient(circle, black 48%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(circle, black 48%, transparent 72%)',
          }}
        />
      </div>

      {/* Subtle Interstellar Singularity Halo on Upper Right */}
      <motion.div
        className="pointer-events-none absolute top-10 right-[10%] w-48 h-48 md:w-72 md:h-72 opacity-50 hidden sm:block"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img
          src="/assets/aistudio/2026-11-15_10.05.33_9817532e.jpg"
          alt="Cosmic Singularity"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-full mix-blend-screen"
          style={{
            maskImage: 'radial-gradient(circle, black 35%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle, black 35%, transparent 70%)',
          }}
        />
      </motion.div>

      {/* Deep Cinematic Gradient Scrim for Clean Readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#04060d]/95 via-[#04060d]/75 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#04060d]/85 via-transparent to-[#04060d]/60 pointer-events-none" />

      {/* Top Row: Minimalist Tag & Language Switcher (RU / EN) */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs tracking-[0.2em] text-cyan-300/90 font-mono-tabular uppercase">
          <Rocket className="w-4 h-4 text-amber-400" />
          <span>2140 · NASA-INSPIRED EXPLORATION</span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg">
          <Globe className="w-4 h-4 text-cyan-400 ml-2 mr-1" />
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onChangeLanguage('ru');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              language === 'ru'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Русский
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onChangeLanguage('en');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              language === 'en'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Main Clean Hero Typography & 4 Primary Actions */}
      <div className="relative z-10 max-w-xl my-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs md:text-sm uppercase tracking-[0.26em] text-amber-400 font-semibold mb-2">
            {txt.subTagline}
          </p>

          <h1 className="font-display text-6xl md:text-8xl font-extrabold tracking-tight text-white leading-none mb-3 drop-shadow-[0_6px_28px_rgba(6,182,212,0.35)]">
            {txt.brand}
          </h1>

          <div className="w-24 h-1 bg-gradient-to-r from-amber-400 via-cyan-400 to-transparent rounded-full mb-4" />

          <p className="font-display text-lg md:text-2xl text-cyan-200 tracking-wide mb-8">
            {txt.tagline}
          </p>

          <div className="flex flex-col gap-3 max-w-sm">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                soundEngine.startAmbient();
                onStartAdventure();
              }}
              className="flex items-center justify-between px-6 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-base tracking-wide transition-transform active:scale-[0.98] shadow-lg shadow-amber-500/25"
            >
              <span className="whitespace-nowrap">{txt.startAdventure}</span>
              <Play className="w-5 h-5 fill-current" />
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                soundEngine.startAmbient();
                onPlayWithFriends();
              }}
              className="flex items-center justify-between px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/90 text-white font-display font-semibold text-sm tracking-wide transition-colors"
            >
              <span className="whitespace-nowrap">{txt.playWithFriends}</span>
              <Users className="w-5 h-5 text-cyan-400" />
            </button>

            <button
              type="button"
              disabled={!hasSave}
              onClick={() => {
                soundEngine.playClick();
                soundEngine.startAmbient();
                onContinue();
              }}
              className={`flex items-center justify-between px-6 py-3.5 rounded-xl border font-display font-semibold text-sm tracking-wide transition-colors ${
                hasSave
                  ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-900/40 border-slate-800/60 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span className="whitespace-nowrap">{txt.continueGame}</span>
              <RotateCcw className="w-5 h-5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenSettings();
              }}
              className="flex items-center justify-between px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-display font-semibold text-sm tracking-wide transition-colors"
            >
              <span className="whitespace-nowrap">{txt.settings}</span>
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Atmospheric Bar */}
      <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
        <span>
          {language === 'ru'
            ? 'Космическое приключение и выживание · 3D'
            : 'Interactive 3D Space Survival Adventure'}
        </span>
        <span className="font-mono-tabular text-slate-300">ABSIDIAN · 2140</span>
      </div>
    </div>
  );
};
