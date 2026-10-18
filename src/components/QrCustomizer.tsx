import React from 'react';
import { Palette, ShieldCheck, Sparkles, Sliders } from 'lucide-react';
import { QrStyleOptions } from '../types';

interface QrCustomizerProps {
  options: QrStyleOptions;
  onChange: (options: QrStyleOptions) => void;
}

const PRESET_PALETTES = [
  { name: 'Classic Dark', fg: '#000000', bg: '#ffffff' },
  { name: 'Cyber Indigo', fg: '#4f46e5', bg: '#ffffff' },
  { name: 'Neon Emerald', fg: '#059669', bg: '#ffffff' },
  { name: 'Electric Violet', fg: '#7c3aed', bg: '#ffffff' },
  { name: 'Crimson Flame', fg: '#dc2626', bg: '#ffffff' },
  { name: 'Dark Theme', fg: '#e2e8f0', bg: '#090d16' },
];

export const QrCustomizer: React.FC<QrCustomizerProps> = ({ options, onChange }) => {
  const updateOption = <K extends keyof QrStyleOptions>(key: K, value: QrStyleOptions[K]) => {
    onChange({
      ...options,
      [key]: value,
    });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-400" /> QR Code Styling & Branding
        </h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20">
          High Precision
        </span>
      </div>

      {/* Preset Swatches */}
      <div>
        <label className="text-xs font-semibold text-slate-400 block mb-2">Color Themes</label>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_PALETTES.map((preset) => {
            const isSelected = options.foregroundColor === preset.fg && options.backgroundColor === preset.bg;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  onChange({
                    ...options,
                    foregroundColor: preset.fg,
                    backgroundColor: preset.bg,
                  });
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border border-slate-600 shrink-0"
                  style={{ backgroundColor: preset.fg }}
                />
                <span className="truncate">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Pickers */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1.5 font-medium">QR Color</label>
          <div className="flex items-center gap-2 p-1.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <input
              type="color"
              value={options.foregroundColor}
              onChange={(e) => updateOption('foregroundColor', e.target.value)}
              className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
            />
            <input
              type="text"
              value={options.foregroundColor}
              onChange={(e) => updateOption('foregroundColor', e.target.value)}
              className="bg-transparent text-xs text-white font-mono w-full focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1.5 font-medium">Background Color</label>
          <div className="flex items-center gap-2 p-1.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <input
              type="color"
              value={options.backgroundColor}
              onChange={(e) => updateOption('backgroundColor', e.target.value)}
              className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
            />
            <input
              type="text"
              value={options.backgroundColor}
              onChange={(e) => updateOption('backgroundColor', e.target.value)}
              className="bg-transparent text-xs text-white font-mono w-full focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Center Video Play Badge */}
      <div className="pt-2 border-t border-slate-800/80">
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-xs font-semibold text-slate-200 block group-hover:text-white transition">
                Center Video Play Badge
              </span>
              <span className="text-[11px] text-slate-500 block">
                Embeds a sleek play icon in the middle of the QR code
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={options.showCenterLogo}
            onChange={(e) => updateOption('showCenterLogo', e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </label>
      </div>

      {/* Error Correction Level */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Error Correction Level
          </label>
          <span className="text-[11px] text-slate-500">
            {options.errorCorrectionLevel === 'H' ? 'High (Best for logos)' : 'Standard'}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(['L', 'M', 'Q', 'H'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => updateOption('errorCorrectionLevel', level)}
              className={`py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                options.errorCorrectionLevel === level
                  ? 'border-indigo-500 bg-indigo-500/20 text-white'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
