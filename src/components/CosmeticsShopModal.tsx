import React, { useState } from 'react';
import { Check, Coins, ShoppingBag, Sparkles, X } from 'lucide-react';
import { Language, PlayerCustomization } from '../types/game';
import {
  DECORATION_CATALOG,
  DecorationCatalogItem,
  SKIN_CATALOG,
  SkinCatalogItem,
} from '../data/shopAndRewards';
import { soundEngine } from '../audio/soundEngine';

interface CosmeticsShopModalProps {
  language: Language;
  coins: number;
  player: PlayerCustomization;
  ownedSkins: string[];
  ownedDecorations: string[];
  onBuySkin: (skin: SkinCatalogItem) => void;
  onEquipSkin: (skin: SkinCatalogItem) => void;
  onBuyDecoration: (deco: DecorationCatalogItem) => void;
  onToggleDecoration: (decoId: string) => void;
  onClose: () => void;
}

export const CosmeticsShopModal: React.FC<CosmeticsShopModalProps> = ({
  language,
  coins,
  player,
  ownedSkins,
  ownedDecorations,
  onBuySkin,
  onEquipSkin,
  onBuyDecoration,
  onToggleDecoration,
  onClose,
}) => {
  const ru = language === 'ru';
  const [tab, setTab] = useState<'skins' | 'decorations'>('decorations');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#090e1a] border-2 border-cyan-500/50 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-cyan-400" />
            <div>
              <h3 className="font-display text-xl font-bold text-white">
                {ru ? 'Магазин скинов и украшений ABSIDIAN' : 'ABSIDIAN Skins & Cosmetics Shop'}
              </h3>
              <p className="text-xs text-slate-400">
                {ru
                  ? 'Покупай крутые скафандры и 3D-украшения за монетки, заработанные в заданиях!'
                  : 'Buy custom spacesuit skins & 3D gear decorations with coins earned from tasks!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 font-mono-tabular font-bold text-sm text-amber-300 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{coins}</span>
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
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setTab('decorations');
            }}
            className={`flex-1 py-2.5 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
              tab === 'decorations'
                ? 'bg-cyan-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{ru ? '3D-Украшения для скина' : '3D Skin Decorations'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setTab('skins');
            }}
            className={`flex-1 py-2.5 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
              tab === 'skins'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 border border-slate-800'
            }`}
          >
            <span>🚀</span>
            <span>{ru ? 'Скины скафандров' : 'Spacesuit Skins'}</span>
          </button>
        </div>

        {/* Tab 1: 3D Decorations */}
        {tab === 'decorations' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DECORATION_CATALOG.map((deco) => {
              const owned = ownedDecorations.includes(deco.id);
              const equipped = player.decorations.includes(deco.id);
              const canAfford = coins >= deco.price;
              return (
                <div
                  key={deco.id}
                  className={`p-4 rounded-xl border-2 flex items-center justify-between gap-4 ${
                    equipped
                      ? 'bg-cyan-950/35 border-cyan-400'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                      {deco.emoji}
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm text-white">
                        {ru ? deco.nameRu : deco.nameEn}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {ru ? deco.descRu : deco.descEn}
                      </div>
                    </div>
                  </div>

                  {owned ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        onToggleDecoration(deco.id);
                      }}
                      className={`px-3.5 py-2 rounded-xl font-display font-bold text-xs shrink-0 flex items-center gap-1 ${
                        equipped
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {equipped && <Check className="w-3.5 h-3.5" />}
                      <span>{equipped ? (ru ? 'Надето' : 'Equipped') : ru ? 'Надеть' : 'Equip'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => {
                        soundEngine.playSuccess();
                        onBuyDecoration(deco);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-mono-tabular font-bold text-xs shrink-0"
                    >
                      {deco.price} 🪙
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Spacesuit Skins */}
        {tab === 'skins' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SKIN_CATALOG.map((skin) => {
              const owned = ownedSkins.includes(skin.id);
              const equipped = player.skinId === skin.id;
              const canAfford = coins >= skin.price;
              return (
                <div
                  key={skin.id}
                  className={`p-4 rounded-xl border-2 flex items-center justify-between gap-4 ${
                    equipped
                      ? 'bg-amber-950/35 border-amber-400'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: skin.suitColor, borderColor: skin.accentColor }}
                    >
                      {skin.previewBadge}
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm text-white">
                        {ru ? skin.nameRu : skin.nameEn}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {ru ? skin.descRu : skin.descEn}
                      </div>
                    </div>
                  </div>

                  {owned ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        onEquipSkin(skin);
                      }}
                      className={`px-3.5 py-2 rounded-xl font-display font-bold text-xs shrink-0 flex items-center gap-1 ${
                        equipped
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {equipped && <Check className="w-3.5 h-3.5" />}
                      <span>{equipped ? (ru ? 'Выбран' : 'Active') : ru ? 'Надеть' : 'Equip'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => {
                        soundEngine.playSuccess();
                        onBuySkin(skin);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-mono-tabular font-bold text-xs shrink-0"
                    >
                      {skin.price} 🪙
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
