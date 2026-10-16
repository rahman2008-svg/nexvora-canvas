import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CanvasCamera,
  CanvasPage,
  CanvasShape,
  StyleState,
  ToolType,
} from './types/canvas';
import { getInitialShapes } from './utils/starterData';
import { getCombinedBounds, uid } from './utils/math';
import {
  exportToPng,
  exportToSvg,
  exportToJson,
  copySvgToClipboard,
} from './utils/export';
import { TopNav } from './components/TopNav';
import { Toolbar } from './components/Toolbar';
import { StylePanel } from './components/StylePanel';
import { CanvasRenderer } from './components/CanvasRenderer';
import { AboutModal } from './components/AboutModal';
import { ShortcutsModal } from './components/ShortcutsModal';

const STORAGE_KEY = 'nexvora_canvas_v1';
const THEME_KEY = 'nexvora_theme';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved !== null) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDark]);

  // Document title
  const [documentTitle, setDocumentTitle] = useState('NexVora Canvas — Board 1');

  // Pages & Shapes state
  const [pages, setPages] = useState<CanvasPage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pages && parsed.pages.length > 0) {
          return parsed.pages;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved canvas, initializing starter demo');
    }
    return [
      {
        id: 'page_1',
        name: 'Page 1',
        shapes: getInitialShapes(),
      },
    ];
  });

  const [currentPageId, setCurrentPageId] = useState<string>(() => pages[0]?.id || 'page_1');

  // Active page's shapes helper
  const currentPage = pages.find((p) => p.id === currentPageId) || pages[0];
  const shapes = currentPage?.shapes || [];

  const setShapes = useCallback(
    (updater: React.SetStateAction<CanvasShape[]>) => {
      setPages((prevPages) =>
        prevPages.map((page) => {
          if (page.id === currentPageId) {
            const newShapes = typeof updater === 'function' ? updater(page.shapes) : updater;
            return { ...page, shapes: newShapes };
          }
          return page;
        })
      );
    },
    [currentPageId]
  );

  // Undo / Redo History Stack per page
  const [undoStack, setUndoStack] = useState<CanvasShape[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasShape[][]>([]);

  const commitHistory = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-30), shapes]);
    setRedoStack([]);
  }, [shapes]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, shapes]);
    setShapes(previous);
    setUndoStack((prev) => prev.slice(0, -1));
  }, [undoStack, shapes, setShapes]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, shapes]);
    setShapes(next);
    setRedoStack((prev) => prev.slice(0, -1));
  }, [redoStack, shapes, setShapes]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          pages,
          currentPageId,
          documentTitle,
        })
      );
    } catch {
      // ignore quota errors
    }
  }, [pages, currentPageId, documentTitle]);

  // Active Tool & Selection
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Camera (Pan & Zoom)
  const [camera, setCamera] = useState<CanvasCamera>({ x: 40, y: 40, z: 1.0 });

  // Grid & Snapping
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Style State
  const [styleState, setStyleState] = useState<StyleState>({
    color: '#1e293b',
    fill: '#3b82f6',
    fillStyle: 'none',
    strokeWidth: 'm',
    strokeStyle: 'draw',
    fontFamily: 'draw',
    fontSize: 'm',
    textAlign: 'left',
    stickyColor: 'yellow',
  });

  const [isStylePanelOpen, setIsStylePanelOpen] = useState(false);

  // Modals
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Update styles for active tool and currently selected shapes
  const handleChangeStyle = (updates: Partial<StyleState>) => {
    setStyleState((prev) => ({ ...prev, ...updates }));

    if (selectedIds.length > 0) {
      commitHistory();
      setShapes((prev) =>
        prev.map((s) => {
          if (!selectedIds.includes(s.id)) return s;
          const updated: any = { ...s };
          if (updates.color !== undefined) updated.color = updates.color;
          if (updates.fill !== undefined) updated.fill = updates.fill;
          if (updates.fillStyle !== undefined) updated.fillStyle = updates.fillStyle;
          if (updates.strokeWidth !== undefined) updated.strokeWidth = updates.strokeWidth === 's' ? 2 : updates.strokeWidth === 'm' ? 3.5 : updates.strokeWidth === 'l' ? 6 : 10;
          if (updates.strokeStyle !== undefined) updated.strokeStyle = updates.strokeStyle;
          if (updates.fontFamily !== undefined) updated.fontFamily = updates.fontFamily;
          if (updates.fontSize !== undefined) updated.fontSize = updates.fontSize === 's' ? 15 : updates.fontSize === 'm' ? 22 : updates.fontSize === 'l' ? 32 : 46;
          if (updates.textAlign !== undefined) updated.textAlign = updates.textAlign;
          if (updates.stickyColor !== undefined && s.type === 'sticky') updated.color = updates.stickyColor;
          return updated;
        })
      );
    }
  };

  // Selection helpers
  const handleSelectShape = (id: string, isShift: boolean) => {
    if (isShift) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    commitHistory();
    setShapes((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
    setSelectedIds([]);
  }, [selectedIds, commitHistory, setShapes]);

  const handleDuplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    commitHistory();
    const newSelectedIds: string[] = [];
    const newShapes: CanvasShape[] = [];

    shapes.forEach((s) => {
      if (selectedIds.includes(s.id)) {
        const copyId = uid();
        newSelectedIds.push(copyId);
        const duplicated: any = {
          ...s,
          id: copyId,
          x: s.x + 25,
          y: s.y + 25,
        };
        if ('startX' in duplicated) {
          duplicated.startX += 25;
          duplicated.startY += 25;
          duplicated.endX += 25;
          duplicated.endY += 25;
        }
        newShapes.push(duplicated);
      }
    });

    setShapes((prev) => [...prev, ...newShapes]);
    setSelectedIds(newSelectedIds);
  }, [selectedIds, shapes, commitHistory, setShapes]);

  const handleBringForward = () => {
    if (selectedIds.length === 0) return;
    commitHistory();
    setShapes((prev) => {
      const selected = prev.filter((s) => selectedIds.includes(s.id));
      const unselected = prev.filter((s) => !selectedIds.includes(s.id));
      return [...unselected, ...selected];
    });
  };

  const handleSendBackward = () => {
    if (selectedIds.length === 0) return;
    commitHistory();
    setShapes((prev) => {
      const selected = prev.filter((s) => selectedIds.includes(s.id));
      const unselected = prev.filter((s) => !selectedIds.includes(s.id));
      return [...selected, ...unselected];
    });
  };

  const handleToggleLock = () => {
    if (selectedIds.length === 0) return;
    commitHistory();
    const allLocked = shapes.filter((s) => selectedIds.includes(s.id)).every((s) => s.isLocked);
    setShapes((prev) =>
      prev.map((s) =>
        selectedIds.includes(s.id) ? { ...s, isLocked: !allLocked } : s
      )
    );
  };

  // Zoom to Fit
  const handleZoomToFit = () => {
    if (shapes.length === 0) {
      setCamera({ x: 40, y: 40, z: 1.0 });
      return;
    }
    const bounds = getCombinedBounds(shapes);
    if (!bounds) return;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const pad = 120;

    const scaleX = (viewportW - pad) / Math.max(bounds.width, 200);
    const scaleY = (viewportH - pad) / Math.max(bounds.height, 200);
    const newZoom = Math.min(1.8, Math.max(0.2, Math.min(scaleX, scaleY)));

    const newX = (viewportW - bounds.width * newZoom) / 2 - bounds.minX * newZoom;
    const newY = (viewportH - bounds.height * newZoom) / 2 - bounds.minY * newZoom;

    setCamera({ x: newX, y: newY, z: newZoom });
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedIds(shapes.map((s) => s.id));
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
        return;
      }

      if (e.key === '?') {
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Tool shortcuts
      const k = e.key.toLowerCase();
      if (k === 'v' || k === '1') setActiveTool('select');
      else if (k === 'h' || k === '2') setActiveTool('hand');
      else if (k === 'p' || k === 'd' || k === '3') setActiveTool('draw');
      else if (k === 'e' || k === '4') setActiveTool('eraser');
      else if (k === 'a' || k === '5') setActiveTool('arrow');
      else if (k === 'l' || k === '6') setActiveTool('line');
      else if (k === 'r' || k === '7') setActiveTool('rectangle');
      else if (k === 'o' || k === '8') setActiveTool('ellipse');
      else if (k === 't' || k === '9') setActiveTool('text');
      else if (k === 's' || k === '0') setActiveTool('sticky');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleDuplicateSelected, handleDeleteSelected, selectedIds, shapes]);

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        commitHistory();
        const maxW = 400;
        const aspect = img.width / img.height;
        const w = Math.min(maxW, img.width);
        const h = w / aspect;

        const newImg: CanvasShape = {
          id: uid(),
          type: 'image',
          x: (-camera.x + window.innerWidth / 2) / camera.z - w / 2,
          y: (-camera.y + window.innerHeight / 2) / camera.z - h / 2,
          width: w,
          height: h,
          src: reader.result as string,
          aspectRatio: aspect,
        };

        setShapes((prev) => [...prev, newImg]);
        setSelectedIds([newImg.id]);
        setActiveTool('select');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Page Operations
  const handleAddPage = () => {
    const newId = `page_${Date.now()}`;
    const newPage: CanvasPage = {
      id: newId,
      name: `Page ${pages.length + 1}`,
      shapes: [],
    };
    setPages((prev) => [...prev, newPage]);
    setCurrentPageId(newId);
    setSelectedIds([]);
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleRenamePage = (id: string, name: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  };

  const handleDeletePage = (id: string) => {
    if (pages.length <= 1) return;
    const remaining = pages.filter((p) => p.id !== id);
    setPages(remaining);
    if (currentPageId === id) {
      setCurrentPageId(remaining[0].id);
    }
  };

  // Import JSON project
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed.pages && Array.isArray(parsed.pages)) {
          setPages(parsed.pages);
          if (parsed.currentPageId) setCurrentPageId(parsed.currentPageId);
          if (parsed.appName) setDocumentTitle(parsed.appName);
          setUndoStack([]);
          setRedoStack([]);
        }
      } catch (err) {
        alert('Invalid NexVora Canvas project file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#f8f9fa] dark:bg-[#151517] font-sans-clean select-none">
      {/* Top Navigation Bar */}
      <TopNav
        documentTitle={documentTitle}
        onChangeDocumentTitle={setDocumentTitle}
        pages={pages}
        currentPageId={currentPageId}
        onSelectPage={setCurrentPageId}
        onAddPage={handleAddPage}
        onRenamePage={handleRenamePage}
        onDeletePage={handleDeletePage}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={camera.z}
        onZoomIn={() => setCamera((prev) => ({ ...prev, z: Math.min(4.0, prev.z * 1.2) }))}
        onZoomOut={() => setCamera((prev) => ({ ...prev, z: Math.max(0.15, prev.z / 1.2) }))}
        onResetZoom={() => setCamera((prev) => ({ ...prev, z: 1.0 }))}
        onZoomToFit={handleZoomToFit}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onExportPng={() => exportToPng(shapes, `${documentTitle.replace(/\s+/g, '-').toLowerCase()}.png`, isDark)}
        onExportSvg={() => exportToSvg(shapes, `${documentTitle.replace(/\s+/g, '-').toLowerCase()}.svg`, isDark)}
        onExportJson={() => exportToJson(pages, currentPageId, `${documentTitle.replace(/\s+/g, '-').toLowerCase()}.nexvora`)}
        onImportJson={handleImportJson}
        onCopySvg={async () => {
          const success = await copySvgToClipboard(shapes, isDark);
          if (success) {
            // briefly show toast or feedback
          }
        }}
        onClearCanvas={() => {
          commitHistory();
          setShapes([]);
          setSelectedIds([]);
        }}
        onResetDemo={() => {
          commitHistory();
          setShapes(getInitialShapes());
          setSelectedIds([]);
          setCamera({ x: 40, y: 40, z: 1.0 });
        }}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Interactive Vector Canvas */}
      <CanvasRenderer
        shapes={shapes}
        setShapes={setShapes}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        camera={camera}
        setCamera={setCamera}
        styleState={styleState}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        isDark={isDark}
        onCommitHistory={commitHistory}
        onSelectShape={handleSelectShape}
      />

      {/* Floating Style Panel (when open or element selected) */}
      {(isStylePanelOpen || selectedIds.length > 0) && (
        <div className="absolute top-18 right-4 z-40 animate-in fade-in slide-in-from-right-4 duration-200">
          <StylePanel
            styleState={styleState}
            onChangeStyle={handleChangeStyle}
            selectedShapes={selectedShapes}
            onDuplicateSelected={handleDuplicateSelected}
            onDeleteSelected={handleDeleteSelected}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
            onToggleLock={handleToggleLock}
            activeTool={activeTool}
          />
        </div>
      )}

      {/* Floating Bottom Toolbar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
        <Toolbar
          activeTool={activeTool}
          onSelectTool={(t) => {
            setActiveTool(t);
            if (t !== 'select' && t !== 'hand') {
              setIsStylePanelOpen(true);
            }
          }}
          isStylePanelOpen={isStylePanelOpen}
          onToggleStylePanel={() => setIsStylePanelOpen(!isStylePanelOpen)}
          onImageUpload={handleImageUpload}
        />
      </div>

      {/* Modals */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
