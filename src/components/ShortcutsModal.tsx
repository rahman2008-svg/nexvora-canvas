import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'V / 1', desc: 'Select / Move tool' },
    { key: 'H / 2', desc: 'Hand / Pan canvas' },
    { key: 'P / D / 3', desc: 'Draw / Freehand pen' },
    { key: 'E / 4', desc: 'Eraser' },
    { key: 'A / 5', desc: 'Arrow tool' },
    { key: 'L / 6', desc: 'Line tool' },
    { key: 'R / 7', desc: 'Rectangle tool' },
    { key: 'O / 8', desc: 'Ellipse / Circle tool' },
    { key: 'T / 9', desc: 'Text tool' },
    { key: 'S / 0', desc: 'Sticky Note tool' },
    { key: 'Space + Drag', desc: 'Quick Pan Canvas' },
    { key: 'Ctrl + Z / ⌘Z', desc: 'Undo' },
    { key: 'Ctrl + Y / ⌘⇧Z', desc: 'Redo' },
    { key: 'Ctrl + A / ⌘A', desc: 'Select All shapes' },
    { key: 'Backspace / Del', desc: 'Delete selected shape' },
    { key: 'Ctrl + D', desc: 'Duplicate selected' },
    { key: 'Ctrl + Scroll', desc: 'Zoom in / out' },
    { key: 'Shift + Click', desc: 'Add to selection' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#1a1c23] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-sans-clean">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {shortcuts.map((sc, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#21242d] border border-slate-100 dark:border-slate-800/60">
              <span className="text-xs text-slate-600 dark:text-slate-300">{sc.desc}</span>
              <kbd className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-[#16181f] border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
