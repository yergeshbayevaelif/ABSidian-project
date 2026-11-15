import React from 'react';
import { Award, Download, Globe, RotateCcw } from 'lucide-react';
import { BuildingInstance, Language, PlayerCustomization, ResourcesState } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface DebriefCertificateProps {
  language: Language;
  player: PlayerCustomization;
  resources: ResourcesState;
  buildings: BuildingInstance[];
  completedMissions: string[];
  onReplay: () => void;
  onContinueSandbox: () => void;
}

export const DebriefCertificate: React.FC<DebriefCertificateProps> = ({
  language,
  player,
  resources,
  buildings,
  completedMissions,
  onReplay,
  onContinueSandbox,
}) => {
  const ru = language === 'ru';
  const moonCount = buildings.filter((b) => b.planet === 'moon').length;
  const marsCount = buildings.filter((b) => b.planet === 'mars').length;

  const handlePrint = () => {
    soundEngine.playSuccess();
    window.print();
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#060913] text-slate-100 p-6 md:p-10 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-slate-900 border-2 border-amber-400/60 rounded-2xl p-6 md:p-10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#0b3d91] border-2 border-white flex items-center justify-center font-display font-bold text-white text-sm">
              NASA
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                {ru ? 'ГЛАВА 12 · НАСЛЕДИЕ МИССИИ' : 'CHAPTER 12 · MISSION DEBRIEF & LEGACY'}
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
                {ru ? 'Сертификат командира ABSIDIAN' : 'ABSIDIAN Commander Certificate'}
              </h1>
            </div>
          </div>
          <Award className="w-10 h-10 text-amber-400 shrink-0" />
        </div>

        <p className="text-sm md:text-base text-slate-200 mb-6 leading-relaxed">
          {ru
            ? `Поздравляем, ${player.name}! Ты начал как инженер на Земле во время солнечной бури 2140 года, прошёл академию, построил автономные базы на Луне и Марсе и доказал: выживание — это инженерное решение.`
            : `Congratulations, ${player.name}! You began as an Earth engineer during the 2140 solar storm, earned your wings at the Academy, built Moon and Mars bases from scratch, and proved that survival is a decision.`}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-center">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400">{ru ? 'Модули Луны' : 'Moon Modules'}</div>
            <div className="font-mono-tabular text-2xl font-bold text-cyan-400">{moonCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400">{ru ? 'Модули Марса' : 'Mars Modules'}</div>
            <div className="font-mono-tabular text-2xl font-bold text-amber-400">{marsCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400">{ru ? 'Научные очки' : 'Science Score'}</div>
            <div className="font-mono-tabular text-2xl font-bold text-purple-400">{resources.sciencePoints}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400">{ru ? 'Этапы миссии' : 'Tasks Solved'}</div>
            <div className="font-mono-tabular text-2xl font-bold text-emerald-400">{completedMissions.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/35 border border-emerald-700/60 text-xs md:text-sm text-emerald-100 mb-6 flex items-start gap-3">
          <Globe className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-emerald-300 mb-1">
              {ru ? 'Как космос помогает Земле' : 'How Space Tech Helps Earth'}
            </div>
            <p>
              {ru
                ? 'Замкнутая очистка воды, умные солнечные микросети и гидропонные оранжереи из проекта ABSIDIAN помогают засушливым регионам и городам Земли пережить климатические кризисы!'
                : 'Closed-loop water recycling, smart solar microgrids, and hydroponic greenhouses tested on the Moon and Mars help Earth cities stay resilient during droughts and storms!'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm"
          >
            <Download className="w-4 h-4" />
            <span>{ru ? 'Сохранить / распечатать сертификат' : 'Save / Print Certificate'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onContinueSandbox();
            }}
            className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm"
          >
            {ru ? 'Вернуться на базу' : 'Explore Bases Free-Play'}
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onReplay();
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{ru ? 'В меню' : 'Title Screen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
