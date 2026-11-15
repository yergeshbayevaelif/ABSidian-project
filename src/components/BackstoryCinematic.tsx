import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, FastForward, Sparkles } from 'lucide-react';
import { Language } from '../types/game';
import { BACKSTORY_SLIDES, SPACE_PIONEERS } from '../data/storyData';
import { t } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

interface BackstoryCinematicProps {
  language: Language;
  onFinish: () => void;
}

export const BackstoryCinematic: React.FC<BackstoryCinematicProps> = ({ language, onFinish }) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [pioneerIdx, setPioneerIdx] = useState(0);
  const txt = t(language);

  const slide = BACKSTORY_SLIDES[slideIdx];
  const isPioneersSlide = slide.id === 'pioneers';
  const pioneer = SPACE_PIONEERS[pioneerIdx];

  const handleNext = () => {
    soundEngine.playClick();
    if (slideIdx < BACKSTORY_SLIDES.length - 1) {
      setSlideIdx((s) => s + 1);
    } else {
      soundEngine.playAlert(); // Transition right into the 2140 Solar Storm blackout!
      onFinish();
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#04060c] flex flex-col justify-between p-6 md:p-12">
      {/* Animated Cinematic Backdrop */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.72, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${slide.imageUrl})` }}
        />
      </AnimatePresence>

      {/* Solar Storm Orange/Red Pulse on Slide 2 */}
      {slide.id === 'solar_storm_2140' && (
        <motion.div
          className="absolute inset-0 bg-radial from-amber-500/25 via-rose-900/25 to-transparent pointer-events-none"
          animate={{ opacity: [0.3, 0.85, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-[#04060c] via-[#04060c]/60 to-[#04060c]/75 pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="font-mono-tabular text-sm font-bold text-amber-400 tracking-widest">
          {slide.yearLabel}
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onFinish();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/85 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <span>{txt.skip}</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Story Content */}
      <div className="relative z-10 max-w-3xl mx-auto my-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45 }}
            className="bg-slate-950/85 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl"
          >
            <h2 className="font-display text-2xl md:text-4xl font-bold text-white mb-4">
              {language === 'ru' ? slide.titleRu : slide.titleEn}
            </h2>
            <p className="text-base md:text-lg text-slate-200 leading-relaxed mb-5">
              {language === 'ru' ? slide.textRu : slide.textEn}
            </p>

            {/* Interactive Pioneering Women Showcase on Slide 3 */}
            {isPioneersSlide && (
              <div className="mb-5 p-4 rounded-xl bg-slate-900 border border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-cyan-400">
                    {pioneer.year} · {language === 'ru' ? pioneer.roleRu : pioneer.roleEn}
                  </span>
                  <div className="flex gap-1.5">
                    {SPACE_PIONEERS.map((p, i) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setPioneerIdx(i);
                        }}
                        className={`w-6 h-6 rounded-md text-[11px] font-mono-tabular font-bold transition-colors ${
                          i === pioneerIdx
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="font-display text-lg font-bold text-white mb-1">{pioneer.name}</div>
                <p className="text-sm text-slate-300">
                  {language === 'ru' ? pioneer.factRu : pioneer.factEn}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-cyan-300 bg-cyan-950/50 border border-cyan-800/60 rounded-lg px-3.5 py-2.5">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{language === 'ru' ? slide.factBadgeRu : slide.factBadgeEn}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Progress & Continue */}
      <div className="relative z-10 flex items-center justify-between max-w-3xl w-full mx-auto">
        <div className="flex gap-2">
          {BACKSTORY_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSlideIdx(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === slideIdx ? 'w-10 bg-amber-400' : 'w-3 bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm"
        >
          <span>
            {slideIdx === BACKSTORY_SLIDES.length - 1
              ? language === 'ru'
                ? 'Начать смену в лаборатории'
                : 'Enter Research Lab'
              : txt.next}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
