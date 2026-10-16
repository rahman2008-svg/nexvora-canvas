import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  ChevronDown, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Sun, 
  Moon, 
  Share2, 
  Download, 
  FileText, 
  FileCode, 
  Plus, 
  Trash2, 
  Edit3, 
  Info, 
  HelpCircle, 
  Check, 
  Grid, 
  Magnet, 
  Sparkles,
  Heart,
  FolderOpen
} from 'lucide-react';
import { CanvasPage } from '../types/canvas';

interface TopNavProps {
  documentTitle: string;
  onChangeDocumentTitle: (title: string) => void;
  pages: CanvasPage[];
  currentPageId: string;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onRenamePage: (id: string, name: string) => void;
  onDeletePage: (id: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onZoomToFit: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCopySvg: () => void;
  onClearCanvas: () => void;
  onResetDemo: () => void;
  onOpenAbout: () => void;
  onOpenShortcuts: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  documentTitle,
  onChangeDocumentTitle,
  pages,
  currentPageId,
  onSelectPage,
  onAddPage,
  onRenamePage,
  onDeletePage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onZoomToFit,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  isDark,
  onToggleTheme,
  onExportPng,
  onExportSvg,
  onExportJson,
  onImportJson,
  onCopySvg,
  onClearCanvas,
  onResetDemo,
  onOpenAbout,
  onOpenShortcuts,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pagesDropdownOpen, setPagesDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageNameInput, setPageNameInput] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const currentPage = pages.find((p) => p.id === currentPageId) || pages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (pagesRef.current && !pagesRef.current.contains(e.target as Node)) {
        setPagesDropdownOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3 pointer-events-none">
      <input
        type="file"
        ref={jsonFileInputRef}
        onChange={onImportJson}
        accept=".json,.nexvora"
        className="hidden"
      />

      {/* Left Section: Brand Menu, Document Title, Pages */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Main Logo & Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/90 dark:border-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
            title="NexVora Canvas Menu"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-draw font-bold shadow-2xs">
              N
            </div>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100 hidden sm:inline tracking-tight">
              NexVora Canvas
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Menu Dropdown */}
          {menuOpen && (
            <div className="absolute top-12 left-0 w-64 bg-white dark:bg-[#1a1c23] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80">
                <p className="font-bold text-slate-900 dark:text-white">NexVora Canvas</p>
                <p className="text-[11px] text-slate-400">By Prince AR Abdur Rahman • v1.0.0</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onAddPage();
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition"
                >
                  <Plus className="w-4 h-4 text-slate-500" />
                  <span>New Page</span>
                </button>
                <button
                  onClick={() => {
                    jsonFileInputRef.current?.click();
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition"
                >
                  <FolderOpen className="w-4 h-4 text-slate-500" />
                  <span>Open Project (.nexvora)</span>
                </button>
                <button
                  onClick={() => {
                    onExportJson();
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Save Project File</span>
                </button>
                <button
                  onClick={() => {
                    onResetDemo();
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Load Sample Drawing</span>
                </button>
                <button
                  onClick={() => {
                    onClearCanvas();
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2.5 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Current Canvas</span>
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 py-1">
                <button
                  onClick={() => {
                    onToggleGrid();
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Grid className="w-4 h-4 text-slate-500" />
                    <span>Dot Grid</span>
                  </div>
                  {showGrid && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>
                <button
                  onClick={() => {
                    onToggleSnap();
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Magnet className="w-4 h-4 text-slate-500" />
                    <span>Snap to Grid</span>
                  </div>
                  {snapToGrid && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>
                <button
                  onClick={() => {
                    onToggleTheme();
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
                    <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
                  </div>
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 py-1">
                <button
                  onClick={() => {
                    onOpenAbout();
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-blue-600 dark:text-blue-400 font-medium transition"
                >
                  <Info className="w-4 h-4" />
                  <span>About Developer & Company</span>
                </button>
                <button
                  onClick={() => {
                    onOpenShortcuts();
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition"
                >
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span>Keyboard Shortcuts (?)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Page Switcher */}
        <div className="relative" ref={pagesRef}>
          <button
            onClick={() => setPagesDropdownOpen(!pagesDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/90 dark:border-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition text-xs font-medium text-slate-700 dark:text-slate-200"
            title="Pages"
          >
            <span>{currentPage?.name || 'Page 1'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {pagesDropdownOpen && (
            <div className="absolute top-12 left-0 w-52 bg-white dark:bg-[#1a1c23] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pages ({pages.length})
              </div>
              <div className="max-h-48 overflow-y-auto">
                {pages.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                      p.id === currentPageId ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {editingPageId === p.id ? (
                      <input
                        type="text"
                        value={pageNameInput}
                        onChange={(e) => setPageNameInput(e.target.value)}
                        onBlur={() => {
                          if (pageNameInput.trim()) onRenamePage(p.id, pageNameInput.trim());
                          setEditingPageId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (pageNameInput.trim()) onRenamePage(p.id, pageNameInput.trim());
                            setEditingPageId(null);
                          }
                        }}
                        autoFocus
                        className="w-full bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-blue-500 text-xs"
                      />
                    ) : (
                      <span
                        onClick={() => {
                          onSelectPage(p.id);
                          setPagesDropdownOpen(false);
                        }}
                        className="truncate flex-1"
                      >
                        {p.name}
                      </span>
                    )}

                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPageId(p.id);
                          setPageNameInput(p.name);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Rename"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      {pages.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePage(p.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-500"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                <button
                  onClick={() => {
                    onAddPage();
                    setPagesDropdownOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Page</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Editable Title */}
        <div className="hidden md:flex items-center px-3 py-1.5 bg-white/90 dark:bg-[#1a1c23]/90 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/90 dark:border-slate-800/90 text-xs">
          {isEditingTitle ? (
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => onChangeDocumentTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              autoFocus
              className="bg-transparent border-none outline-none font-medium text-slate-800 dark:text-slate-100 text-xs w-48"
            />
          ) : (
            <span
              onClick={() => setIsEditingTitle(true)}
              className="cursor-pointer font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[200px]"
              title="Click to rename document"
            >
              {documentTitle}
            </span>
          )}
        </div>
      </div>

      {/* Right Section: Undo/Redo, Zoom, About, Export */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Undo & Redo */}
        <div className="flex items-center p-1 bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/90 dark:border-slate-800/90">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl disabled:opacity-30 disabled:pointer-events-none transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl disabled:opacity-30 disabled:pointer-events-none transition"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="hidden sm:flex items-center p-1 bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/90 dark:border-slate-800/90 text-xs">
          <button
            onClick={onZoomOut}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            className="px-2 py-1 text-slate-700 dark:text-slate-200 font-mono font-medium hover:text-blue-600 transition"
            title="Reset Zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomToFit}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition ml-0.5"
            title="Zoom to Fit All Shapes"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* About Developer Button */}
        <button
          onClick={onOpenAbout}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium text-xs rounded-2xl shadow-md shadow-blue-500/20 transition group"
          title="About Developer Prince AR Abdur Rahman & NexVora Lab's Ofc"
        >
          <Heart className="w-3.5 h-3.5 fill-current text-rose-200 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">About</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/90 dark:border-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-xs font-semibold text-slate-800 dark:text-slate-100"
            title="Export Options"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {exportDropdownOpen && (
            <div className="absolute top-12 right-0 w-48 bg-white dark:bg-[#1a1c23] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  onExportPng();
                  setExportDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="font-semibold">Export as PNG</p>
                  <p className="text-[10px] text-slate-400">High resolution image</p>
                </div>
              </button>

              <button
                onClick={() => {
                  onExportSvg();
                  setExportDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition"
              >
                <FileCode className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="font-semibold">Export as SVG</p>
                  <p className="text-[10px] text-slate-400">Scalable vector graphic</p>
                </div>
              </button>

              <button
                onClick={() => {
                  onCopySvg();
                  setExportDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition"
              >
                <Share2 className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="font-semibold">Copy SVG</p>
                  <p className="text-[10px] text-slate-400">Copy code to clipboard</p>
                </div>
              </button>

              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

              <button
                onClick={() => {
                  onExportJson();
                  setExportDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition"
              >
                <Download className="w-4 h-4 text-indigo-500" />
                <div>
                  <p className="font-semibold">Save Project (.nexvora)</p>
                  <p className="text-[10px] text-slate-400">Save complete workspace</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
