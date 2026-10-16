import React, { useState, useRef } from 'react';
import { ToolType } from '../types/canvas';
import {
  MousePointer2,
  Hand,
  Pencil,
  Eraser,
  ArrowRight,
  Minus,
  Square,
  Circle,
  Triangle,
  Diamond,
  Star,
  Cloud,
  Type,
  StickyNote,
  Image as ImageIcon,
  Sparkles,
  Palette,
  ChevronUp,
  LayoutGrid
} from 'lucide-react';

interface ToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  isStylePanelOpen: boolean;
  onToggleStylePanel: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ShapeOption {
  type: ToolType;
  label: string;
  icon: React.ReactNode;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  isStylePanelOpen,
  onToggleStylePanel,
  onImageUpload,
}) => {
  const [shapesMenuOpen, setShapesMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shapesList: ShapeOption[] = [
    { type: 'rectangle', label: 'Rectangle', icon: <Square className="w-4 h-4" /> },
    { type: 'ellipse', label: 'Ellipse', icon: <Circle className="w-4 h-4" /> },
    { type: 'triangle', label: 'Triangle', icon: <Triangle className="w-4 h-4" /> },
    { type: 'diamond', label: 'Diamond', icon: <Diamond className="w-4 h-4" /> },
    { type: 'star', label: 'Star', icon: <Star className="w-4 h-4" /> },
    { type: 'cloud', label: 'Cloud', icon: <Cloud className="w-4 h-4" /> },
  ];

  const currentShape = shapesList.find((s) => s.type === activeTool) || shapesList[0];
  const isAnyShapeActive = shapesList.some((s) => s.type === activeTool);

  const handleShapeSelect = (type: ToolType) => {
    onSelectTool(type);
    setShapesMenuOpen(false);
  };

  return (
    <div className="relative flex items-center">
      {/* Hidden file input for image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Shapes Selection Popover */}
      {shapesMenuOpen && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 p-2 bg-white dark:bg-[#1a1c23] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-1 animate-in fade-in zoom-in-95 duration-150">
          {shapesList.map((shape) => {
            const isSelected = activeTool === shape.type;
            return (
              <button
                key={shape.type}
                onClick={() => handleShapeSelect(shape.type)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={shape.label}
              >
                {shape.icon}
                <span className="text-[10px] mt-1">{shape.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Floating Dock */}
      <div className="flex items-center gap-1 p-1.5 bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800/90 overflow-x-auto max-w-[94vw]">
        {/* Select */}
        <button
          onClick={() => onSelectTool('select')}
          className={`p-2.5 rounded-xl transition relative group ${
            activeTool === 'select'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Select / Move (V)"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>

        {/* Hand */}
        <button
          onClick={() => onSelectTool('hand')}
          className={`p-2.5 rounded-xl transition relative group ${
            activeTool === 'hand'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Hand / Pan (H)"
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Freehand Draw */}
        <button
          onClick={() => onSelectTool('draw')}
          className={`p-2.5 rounded-xl transition relative group ${
            activeTool === 'draw'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Draw / Pen (P)"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Eraser */}
        <button
          onClick={() => onSelectTool('eraser')}
          className={`p-2.5 rounded-xl transition relative group ${
            activeTool === 'eraser'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Eraser (E)"
        >
          <Eraser className="w-4 h-4" />
        </button>

        {/* Arrow */}
        <button
          onClick={() => onSelectTool('arrow')}
          className={`p-2.5 rounded-xl transition relative group ${
            activeTool === 'arrow'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Arrow (A)"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Line */}
        <button
          onClick={() => onSelectTool('line')}
          className={`p-2.5 rounded-xl transition relative group ${
            activeTool === 'line'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Line (L)"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Shapes Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              if (isAnyShapeActive) {
                setShapesMenuOpen(!shapesMenuOpen);
              } else {
                onSelectTool(currentShape.type);
                setShapesMenuOpen(!shapesMenuOpen);
              }
            }}
            className={`flex items-center gap-0.5 p-2.5 rounded-xl transition ${
              isAnyShapeActive
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={`Shape (${currentShape.label})`}
          >
            {currentShape.icon}
            <ChevronUp className={`w-3 h-3 transition-transform ${shapesMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Text */}
        <button
          onClick={() => onSelectTool('text')}
          className={`p-2.5 rounded-xl transition relative group ${
            activeTool === 'text'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Text (T)"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* Sticky Note */}
        <button
          onClick={() => onSelectTool('sticky')}
          className={`p-2.5 rounded-xl transition relative group ${
            activeTool === 'sticky'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Sticky Note (S)"
        >
          <StickyNote className="w-4 h-4" />
        </button>

        {/* Image Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* Laser Pointer */}
        <button
          onClick={() => onSelectTool('laser')}
          className={`p-2.5 rounded-xl transition relative group ${
            activeTool === 'laser'
              ? 'bg-amber-500 text-white shadow-sm animate-pulse'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Laser Pointer (Presenter)"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Style Panel Toggle */}
        <button
          onClick={onToggleStylePanel}
          className={`p-2.5 rounded-xl transition ${
            isStylePanelOpen
              ? 'bg-slate-200 dark:bg-slate-700 text-blue-600 dark:text-blue-400'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Styles & Properties"
        >
          <Palette className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
