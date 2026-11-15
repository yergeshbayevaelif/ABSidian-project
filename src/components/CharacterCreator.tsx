import React, { useState } from 'react';
import { ArrowLeft, Bot, Check, Rocket, Shield, Sparkles } from 'lucide-react';
import {
  CatBreed,
  Difficulty,
  Language,
  PlayerCustomization,
  Specialization,
} from '../types/game';
import { CAT_BREEDS, SUIT_COLORS, t } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

interface CharacterCreatorProps {
  language: Language;
  initialPlayer: PlayerCustomization;
  initialDifficulty: Difficulty;
  onBack: () => void;
  onComplete: (player: PlayerCustomization, difficulty: Difficulty, saveToServer: boolean) => void;
}

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({
  language,
  initialPlayer,
  initialDifficulty,
  onBack,
  onComplete,
}) => {
  const txt = t(language);
  const [name, setName] = useState(initialPlayer.name || (language === 'ru' ? 'Капитан Мурзик' : 'Captain Astro'));
  const [breed, setBreed] = useState<CatBreed>(initialPlayer.breed);
  const [suitColor, setSuitColor] = useState(initialPlayer.suitColor);
  const [specialization, setSpecialization] = useState<Specialization>(initialPlayer.specialization);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);

  const selectedBreed = CAT_BREEDS.find((b) => b.id === breed) || CAT_BREEDS[0];

  const handleConfirm = (saveToServer: boolean) => {
    soundEngine.playSuccess();
    onComplete(
      {
        ...initialPlayer,
        name: name.trim() || (language === 'ru' ? 'Котик-инженер' : 'Cat Engineer'),
        breed,
        suitColor,
        specialization,
        isGuest: !saveToServer,
      },
      difficulty,
      saveToServer
    );
  };

  return (
    <div className="relative w-full h-full overflow-y-auto bg-[#07090e] text-slate-100 p-4 md:p-8 flex flex-col">
      <div className="max-w-5xl w-full mx-auto my-auto bg-slate-900/95 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onBack();
            }}
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white px-3 py-2 rounded-lg bg-slate-800/80"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{txt.back}</span>
          </button>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
            {language === 'ru' ? 'Создай своего котика-астронавта' : 'Customize Your Cat Astronaut'}
          </h2>
          <div className="text-xs font-mono-tabular text-cyan-400">NASA PATCH READY</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Cat Squad Portrait & Suit Preview */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 flex flex-col items-center text-center">
              <div className="relative w-44 h-44 rounded-full border-4 flex items-center justify-center mb-4 overflow-hidden shadow-inner" style={{ borderColor: suitColor, backgroundColor: '#0f172a' }}>
                <img
                  src="/assets/aistudio/catsinspace_e0224f1c.jpg"
                  alt="Cat Astronaut Portrait"
                  referrerPolicy="no-referrer"
                  className="w-[300%] h-[200%] max-w-none object-cover"
                  style={{
                    objectPosition: `${selectedBreed.col * 50}% ${selectedBreed.row * 100}%`,
                  }}
                />
                {/* NASA Patch Badge on Preview */}
                <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#0b3d91] border-2 border-white flex items-center justify-center text-[10px] font-display font-bold text-white shadow">
                  NASA
                </div>
              </div>
              <div className="font-display text-xl font-bold text-white">{name || 'Cat Explorer'}</div>
              <div className="text-xs text-cyan-400 mt-1">
                {language === 'ru' ? selectedBreed.nameRu : selectedBreed.nameEn}
              </div>
            </div>

            {/* Callsign Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {txt.callsignLabel}
              </label>
              <input
                type="text"
                maxLength={22}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium"
              />
            </div>

            {/* Spacesuit Color */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {txt.suitLabel}
              </label>
              <div className="flex flex-wrap gap-2.5">
                {SUIT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setSuitColor(c.hex);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      suitColor === c.hex
                        ? 'border-cyan-400 bg-slate-800 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full border border-white/30" style={{ backgroundColor: c.hex }} />
                    <span>{language === 'ru' ? c.labelRu : c.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Breed, Specialization, Difficulty (with Rover in Normal!) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* 6 Cat Breeds */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {txt.breedLabel}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {CAT_BREEDS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setBreed(b.id);
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors ${
                      breed === b.id
                        ? 'border-amber-400 bg-amber-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="w-7 h-7 rounded-full border border-slate-600 shrink-0" style={{ backgroundColor: b.fur }} />
                    <span className="text-xs font-semibold leading-tight">
                      {language === 'ru' ? b.nameRu : b.nameEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {txt.specLabel}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(['systems', 'navigation', 'science', 'comms'] as Specialization[]).map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setSpecialization(sp);
                    }}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      specialization === sp
                        ? 'border-cyan-400 bg-cyan-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span>{txt.specs[sp].title}</span>
                      {specialization === sp && <Check className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{txt.specs[sp].desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection (Helper Rover appears on Normal / Engineer!) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {txt.diffLabel}
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {(['explorer', 'engineer', 'commander'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setDifficulty(d);
                    }}
                    className={`flex items-center gap-4 p-3 rounded-xl border text-left transition-colors ${
                      difficulty === d
                        ? 'border-amber-400 bg-amber-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {d === 'engineer' ? (
                      <img
                        src="/assets/aistudio/2026-11-15_10.04.29_5d16570b.jpg"
                        alt="Helper Rover Robot"
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover border border-amber-400/50 shrink-0"
                      />
                    ) : d === 'explorer' ? (
                      <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="w-6 h-6 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6 text-rose-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs font-display font-bold">
                        <span>{txt.difficulties[d].title}</span>
                        {d === 'engineer' && <Bot className="w-4 h-4 text-amber-400" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{txt.difficulties[d].desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start / Save Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm"
              >
                <Rocket className="w-4 h-4" />
                <span>{txt.launchGame}</span>
              </button>
              <button
                type="button"
                onClick={() => handleConfirm(false)}
                className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm"
              >
                {txt.guestMode}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
