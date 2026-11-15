import React, { useState } from 'react';
import { Copy, LogOut, Users, X } from 'lucide-react';
import { Language, RemotePlayer } from '../types/game';
import { t } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

interface MultiplayerModalProps {
  language: Language;
  roomCode: string | null;
  players: RemotePlayer[];
  errorMsg: string | null;
  lastComms: Array<{ id: string; sender: string; phraseKey: string }>;
  onClose: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onLeaveRoom: () => void;
  onSendPreset: (phraseKey: string) => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  language,
  roomCode,
  players,
  errorMsg,
  lastComms,
  onClose,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onSendPreset,
}) => {
  const txt = t(language);
  const ru = language === 'ru';
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  const presetKeys = ['need_help', 'low_o2', 'repair_done', 'meet_base', 'power_on'] as const;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="font-display text-lg font-bold text-white">{txt.multiplayer.title}</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            aria-label={txt.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!roomCode ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSuccess();
                onCreateRoom();
              }}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm"
            >
              {txt.multiplayer.createRoom}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-800" />
              <span className="px-3 text-xs text-slate-500">{ru ? 'или' : 'or'}</span>
              <div className="flex-grow border-t border-slate-800" />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder={txt.multiplayer.codePlaceholder}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono-tabular uppercase tracking-widest focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                disabled={joinCode.trim().length < 4}
                onClick={() => {
                  soundEngine.playClick();
                  onJoinRoom(joinCode.trim());
                }}
                className="px-5 py-3 rounded-xl bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm whitespace-nowrap"
              >
                {ru ? 'Войти' : 'Join'}
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700 text-xs text-rose-200">
                {errorMsg === 'NOT_FOUND'
                  ? txt.multiplayer.errorNotFound
                  : errorMsg === 'ROOM_FULL'
                    ? txt.multiplayer.errorFull
                    : errorMsg}
              </div>
            )}

            <p className="text-xs text-slate-400">
              {ru
                ? 'Безопасный режим для детей: только закрытые комнаты по коду и быстрые игровые команды без открытого чата.'
                : 'Child-safe design: private invite codes only, with preset mission comms instead of public chat.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-cyan-500/40">
              <div>
                <div className="text-[11px] uppercase text-slate-400">{txt.multiplayer.roomCode}</div>
                <div className="font-mono-tabular text-2xl font-bold text-cyan-300 tracking-widest">{roomCode}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(roomCode).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? (ru ? 'Скопировано!' : 'Copied!') : ru ? 'Копировать' : 'Copy'}</span>
              </button>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2">
                {txt.multiplayer.playersInRoom} ({players.length} / 4)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.suitColor }} />
                    <div className="truncate">
                      <div className="font-bold text-white truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-400">{p.sceneId}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2">{txt.multiplayer.safeComms}</div>
              <div className="flex flex-wrap gap-2">
                {presetKeys.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onSendPreset(k);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 border border-slate-700 text-xs text-slate-200"
                  >
                    {txt.presets[k]}
                  </button>
                ))}
              </div>
            </div>

            {lastComms.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 max-h-28 overflow-y-auto text-xs">
                {lastComms.map((c) => (
                  <div key={c.id}>
                    <span className="font-bold text-cyan-400">{c.sender}: </span>
                    <span className="text-slate-200">
                      {txt.presets[c.phraseKey as keyof typeof txt.presets] || c.phraseKey}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onLeaveRoom();
              }}
              className="w-full py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-rose-200 font-semibold text-xs flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>{txt.multiplayer.leaveRoom}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
