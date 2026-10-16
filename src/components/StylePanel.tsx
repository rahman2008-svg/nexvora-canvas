import React from 'react';
import { 
  StyleState, 
  CanvasShape, 
  FillStyle, 
  StrokeStyle, 
  StrokeSize, 
  FontFamily, 
  FontSize, 
  TextAlign 
} from '../types/canvas';
import { 
  Copy, 
  Trash2, 
  BringToFront, 
  SendToBack, 
  Lock, 
  Unlock, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette
} from 'lucide-react';

interface StylePanelProps {
  styleState: StyleState;
  onChangeStyle: (updates: Partial<StyleState>) => void;
  selectedShapes: CanvasShape[];
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onToggleLock: () => void;
  activeTool: string;
}

const PALETTE_COLORS = [
  { name: 'Black', value: '#1e293b' },
  { name: 'Grey', value: '#64748b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#10b981' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'White', value: '#ffffff' },
];

const STICKY_COLORS = [
  { name: 'Yellow', id: 'yellow', bg: '#fef08a' },
  { name: 'Blue', id: 'blue', bg: '#bae6fd' },
  { name: 'Green', id: 'green', bg: '#bbf7d0' },
  { name: 'Pink', id: 'pink', bg: '#fbcfe8' },
  { name: 'Purple', id: 'purple', bg: '#e9d5ff' },
  { name: 'Orange', id: 'orange', bg: '#fed7aa' },
];

export const StylePanel: React.FC<StylePanelProps> = ({
  styleState,
  onChangeStyle,
  selectedShapes,
  onDuplicateSelected,
  onDeleteSelected,
  onBringForward,
  onSendBackward,
  onToggleLock,
  activeTool,
}) => {
  const hasSelection = selectedShapes.length > 0;
  const isLocked = selectedShapes.every((s) => s.isLocked);
  const showTextControls = activeTool === 'text' || selectedShapes.some((s) => s.type === 'text');
  const showStickyControls = activeTool === 'sticky' || selectedShapes.some((s) => s.type === 'sticky');
  const showStrokeControls = !['text', 'image'].includes(activeTool) || selectedShapes.some((s) => !['text', 'image', 'sticky'].includes(s.type));
  const showFillControls = ['rectangle', 'ellipse', 'triangle', 'diamond', 'star', 'cloud'].includes(activeTool) ||
    selectedShapes.some((s) => ['rectangle', 'ellipse', 'triangle', 'diamond', 'star', 'cloud'].includes(s.type));

  return (
    <div className="flex flex-col gap-3 p-3 bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 w-64 max-w-[calc(100vw-32px)]">
      {/* Selection Quick Actions */}
      {hasSelection && (
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {selectedShapes.length} Selected
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onBringForward}
              title="Bring Forward"
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
            >
              <BringToFront className="w-4 h-4" />
            </button>
            <button
              onClick={onSendBackward}
              title="Send Backward"
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
            >
              <SendToBack className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleLock}
              title={isLocked ? 'Unlock' : 'Lock'}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
            >
              {isLocked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4" />}
            </button>
            <button
              onClick={onDuplicateSelected}
              title="Duplicate (Ctrl+D)"
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onDeleteSelected}
              title="Delete (Del)"
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Colors Palette */}
      <div>
        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
          Color
        </label>
        <div className="grid grid-cols-6 gap-1.5">
          {PALETTE_COLORS.map((c) => {
            const isSelected = styleState.color === c.value;
            return (
              <button
                key={c.value}
                onClick={() => onChangeStyle({ color: c.value })}
                title={c.name}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.value, border: c.value === '#ffffff' ? '1px solid #cbd5e1' : undefined }}
              />
            );
          })}
        </div>
      </div>

      {/* Sticky Note Colors */}
      {showStickyControls && (
        <div className="pt-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Note Color
          </label>
          <div className="flex items-center gap-1.5">
            {STICKY_COLORS.map((sc) => {
              const isSelected = styleState.stickyColor === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => onChangeStyle({ stickyColor: sc.id })}
                  title={sc.name}
                  className={`w-7 h-7 rounded-lg border border-slate-300/60 shadow-2xs transition-all ${
                    isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: sc.bg }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Fill Styles */}
      {showFillControls && (
        <div className="pt-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Fill
          </label>
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            {(['none', 'semi', 'solid', 'pattern'] as FillStyle[]).map((f) => {
              const isSelected = styleState.fillStyle === f;
              return (
                <button
                  key={f}
                  onClick={() => onChangeStyle({ fillStyle: f })}
                  className={`py-1 text-[11px] font-medium rounded-lg capitalize transition ${
                    isSelected ? 'bg-white dark:bg-[#1a1c23] shadow-2xs font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stroke Width & Dash */}
      {showStrokeControls && (
        <>
          <div className="pt-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Stroke Size
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
              {(['s', 'm', 'l', 'xl'] as StrokeSize[]).map((s) => {
                const isSelected = styleState.strokeWidth === s;
                return (
                  <button
                    key={s}
                    onClick={() => onChangeStyle({ strokeWidth: s })}
                    className={`py-1 text-[11px] font-bold rounded-lg uppercase transition ${
                      isSelected ? 'bg-white dark:bg-[#1a1c23] shadow-2xs text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Stroke Style
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
              {(['draw', 'solid', 'dashed', 'dotted'] as StrokeStyle[]).map((st) => {
                const isSelected = styleState.strokeStyle === st;
                return (
                  <button
                    key={st}
                    onClick={() => onChangeStyle({ strokeStyle: st })}
                    className={`py-1 text-[11px] capitalize rounded-lg transition ${
                      isSelected ? 'bg-white dark:bg-[#1a1c23] shadow-2xs font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {st === 'draw' ? 'Sketch' : st}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Typography for Text and Sticky */}
      {(showTextControls || showStickyControls) && (
        <div className="pt-1 space-y-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Font Family
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
              {(['draw', 'sans', 'mono'] as FontFamily[]).map((ff) => {
                const isSelected = styleState.fontFamily === ff;
                return (
                  <button
                    key={ff}
                    onClick={() => onChangeStyle({ fontFamily: ff })}
                    className={`py-1 text-[11px] capitalize rounded-lg transition ${
                      isSelected ? 'bg-white dark:bg-[#1a1c23] shadow-2xs font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {ff === 'draw' ? 'Draw' : ff}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Font Size
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
              {(['s', 'm', 'l', 'xl'] as FontSize[]).map((fz) => {
                const isSelected = styleState.fontSize === fz;
                return (
                  <button
                    key={fz}
                    onClick={() => onChangeStyle({ fontSize: fz })}
                    className={`py-1 text-[11px] font-bold uppercase rounded-lg transition ${
                      isSelected ? 'bg-white dark:bg-[#1a1c23] shadow-2xs text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {fz}
                  </button>
                );
              })}
            </div>
          </div>

          {showTextControls && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Align
              </span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
                {(['left', 'center', 'right'] as TextAlign[]).map((al) => {
                  const isSelected = styleState.textAlign === al;
                  return (
                    <button
                      key={al}
                      onClick={() => onChangeStyle({ textAlign: al })}
                      className={`p-1 rounded-md transition ${
                        isSelected ? 'bg-white dark:bg-[#1a1c23] shadow-2xs text-blue-600' : 'text-slate-500'
                      }`}
                    >
                      {al === 'left' ? <AlignLeft className="w-3.5 h-3.5" /> : al === 'center' ? <AlignCenter className="w-3.5 h-3.5" /> : <AlignRight className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
