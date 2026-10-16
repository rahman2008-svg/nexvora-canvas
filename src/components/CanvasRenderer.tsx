import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  CanvasCamera,
  CanvasShape,
  ToolType,
  Point,
  Bounds,
  FreehandShape,
  GeometricShape,
  ArrowShape,
  LineShape,
  TextShape,
  StickyShape,
  ImageShape,
  FrameShape,
  StyleState,
  LaserPoint,
} from '../types/canvas';
import {
  screenToCanvas,
  getShapeBounds,
  getCombinedBounds,
  hitTestShape,
  boundsIntersect,
  pointsToSmoothSvgPath,
  getDashArray,
  getStrokePx,
  getFontSizePx,
  snapCoord,
  uid,
} from '../utils/math';

interface CanvasRendererProps {
  shapes: CanvasShape[];
  setShapes: React.Dispatch<React.SetStateAction<CanvasShape[]>>;
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  camera: CanvasCamera;
  setCamera: React.Dispatch<React.SetStateAction<CanvasCamera>>;
  styleState: StyleState;
  showGrid: boolean;
  snapToGrid: boolean;
  isDark: boolean;
  onCommitHistory: () => void;
  onSelectShape: (id: string, isShift: boolean) => void;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  shapes,
  setShapes,
  activeTool,
  setActiveTool,
  selectedIds,
  setSelectedIds,
  camera,
  setCamera,
  styleState,
  showGrid,
  snapToGrid,
  isDark,
  onCommitHistory,
  onSelectShape,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement>(null);

  // In-progress interactions state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Marquee selection
  const [marqueeBox, setMarqueeBox] = useState<Bounds | null>(null);

  // Drawing in progress
  const [currentDrawShape, setCurrentDrawShape] = useState<CanvasShape | null>(null);

  // Dragging selected shapes
  const [isDraggingShapes, setIsDraggingShapes] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [initialShapePositions, setInitialShapePositions] = useState<Map<string, { x: number; y: number; startX?: number; startY?: number; endX?: number; endY?: number }>>(new Map());

  // Resize handle interaction
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [resizeInitialBounds, setResizeInitialBounds] = useState<Bounds | null>(null);

  // In-place text editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Laser points trail
  const laserTrailRef = useRef<LaserPoint[]>([]);

  // Erasing set
  const erasedIdsRef = useRef<Set<string>>(new Set());

  // Touch pinch zoom state
  const touchDistanceRef = useRef<number | null>(null);
  const touchCenterRef = useRef<Point | null>(null);

  // Listen for space key for quick pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Laser trail animation loop
  useEffect(() => {
    let animId: number;
    const canvas = laserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLaser = () => {
      const now = Date.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Filter out points older than 700ms
      laserTrailRef.current = laserTrailRef.current.filter((pt) => now - pt.timestamp < 700);

      const pts = laserTrailRef.current;
      if (pts.length > 1) {
        ctx.save();
        for (let i = 0; i < pts.length - 1; i++) {
          const age = now - pts[i].timestamp;
          const alpha = Math.max(0, 1 - age / 700);
          const screenP1 = {
            x: pts[i].x * camera.z + camera.x,
            y: pts[i].y * camera.z + camera.y,
          };
          const screenP2 = {
            x: pts[i + 1].x * camera.z + camera.x,
            y: pts[i + 1].y * camera.z + camera.y,
          };

          ctx.beginPath();
          ctx.moveTo(screenP1.x, screenP1.y);
          ctx.lineTo(screenP2.x, screenP2.y);
          ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
          ctx.lineWidth = 6 * alpha;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ef4444';
          ctx.stroke();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(renderLaser);
    };

    animId = requestAnimationFrame(renderLaser);
    return () => cancelAnimationFrame(animId);
  }, [camera]);

  // Sync laser canvas resolution with container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current || !laserCanvasRef.current) return;
      laserCanvasRef.current.width = containerRef.current.clientWidth;
      laserCanvasRef.current.height = containerRef.current.clientHeight;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Zoom with Wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newZoom = Math.min(4.0, Math.max(0.15, camera.z * zoomFactor));

      // Keep point under cursor fixed
      const newX = mouseX - (mouseX - camera.x) * (newZoom / camera.z);
      const newY = mouseY - (mouseY - camera.y) * (newZoom / camera.z);

      setCamera({ x: newX, y: newY, z: newZoom });
    } else {
      // Pan
      setCamera((prev) => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Pointer Down handler
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    if (e.button === 1 || isSpacePressed || activeTool === 'hand') {
      // Middle click, space, or Hand tool -> Pan
      setIsPanning(true);
      setPanStart({ x: e.clientX - camera.x, y: e.clientY - camera.y });
      return;
    }

    if (e.button !== 0) return; // Only primary button

    const rect = containerRef.current.getBoundingClientRect();
    const canvasPt = screenToCanvas(e.clientX, e.clientY, rect, camera);
    const snapX = snapToGrid ? snapCoord(canvasPt.x) : canvasPt.x;
    const snapY = snapToGrid ? snapCoord(canvasPt.y) : canvasPt.y;

    if (activeTool === 'laser') {
      laserTrailRef.current.push({ x: canvasPt.x, y: canvasPt.y, timestamp: Date.now() });
      return;
    }

    if (activeTool === 'eraser') {
      erasedIdsRef.current.clear();
      // Test hit and erase
      const hit = shapes.filter((s) => hitTestShape(canvasPt, s, 16));
      if (hit.length > 0) {
        const hitIds = new Set(hit.map((h) => h.id));
        setShapes((prev) => prev.filter((s) => !hitIds.has(s.id)));
        hitIds.forEach((id) => erasedIdsRef.current.add(id));
      }
      return;
    }

    if (activeTool === 'select') {
      // Hit test existing shapes in reverse z-order (top to bottom)
      const reversed = [...shapes].reverse();
      const clickedShape = reversed.find((s) => hitTestShape(canvasPt, s, 10));

      if (clickedShape) {
        const isShift = e.shiftKey;
        if (isShift) {
          onSelectShape(clickedShape.id, true);
        } else {
          if (!selectedIds.includes(clickedShape.id)) {
            setSelectedIds([clickedShape.id]);
          }
        }

        // Start dragging shapes
        setIsDraggingShapes(true);
        setDragStartPoint(canvasPt);
        const posMap = new Map();
        shapes.forEach((s) => {
          if (selectedIds.includes(s.id) || s.id === clickedShape.id) {
            posMap.set(s.id, {
              x: s.x,
              y: s.y,
              startX: 'startX' in s ? s.startX : undefined,
              startY: 'startY' in s ? s.startY : undefined,
              endX: 'endX' in s ? s.endX : undefined,
              endY: 'endY' in s ? s.endY : undefined,
            });
          }
        });
        setInitialShapePositions(posMap);
      } else {
        // Clicked empty area
        if (!e.shiftKey) {
          setSelectedIds([]);
        }
        // Start marquee selection
        setMarqueeBox({
          minX: canvasPt.x,
          minY: canvasPt.y,
          maxX: canvasPt.x,
          maxY: canvasPt.y,
          width: 0,
          height: 0,
        });
      }
      return;
    }

    // Creating shapes
    const strokeWidth = getStrokePx(styleState.strokeWidth);
    const fontSize = getFontSizePx(styleState.fontSize);

    if (activeTool === 'draw') {
      const newFreehand: FreehandShape = {
        id: uid(),
        type: 'draw',
        x: canvasPt.x,
        y: canvasPt.y,
        points: [{ x: canvasPt.x, y: canvasPt.y, pressure: e.pressure || 0.5 }],
        color: styleState.color,
        strokeWidth,
        strokeStyle: styleState.strokeStyle,
      };
      setCurrentDrawShape(newFreehand);
      return;
    }

    if (['rectangle', 'ellipse', 'triangle', 'diamond', 'star', 'cloud'].includes(activeTool)) {
      const newGeom: GeometricShape = {
        id: uid(),
        type: activeTool as any,
        x: snapX,
        y: snapY,
        width: 1,
        height: 1,
        color: styleState.color,
        fill: styleState.color,
        fillStyle: styleState.fillStyle,
        strokeWidth,
        strokeStyle: styleState.strokeStyle,
      };
      setCurrentDrawShape(newGeom);
      return;
    }

    if (activeTool === 'arrow') {
      const newArrow: ArrowShape = {
        id: uid(),
        type: 'arrow',
        x: snapX,
        y: snapY,
        startX: snapX,
        startY: snapY,
        endX: snapX + 1,
        endY: snapY + 1,
        color: styleState.color,
        strokeWidth,
        strokeStyle: styleState.strokeStyle,
      };
      setCurrentDrawShape(newArrow);
      return;
    }

    if (activeTool === 'line') {
      const newLine: LineShape = {
        id: uid(),
        type: 'line',
        x: snapX,
        y: snapY,
        startX: snapX,
        startY: snapY,
        endX: snapX + 1,
        endY: snapY + 1,
        color: styleState.color,
        strokeWidth,
        strokeStyle: styleState.strokeStyle,
      };
      setCurrentDrawShape(newLine);
      return;
    }

    if (activeTool === 'text') {
      const newText: TextShape = {
        id: uid(),
        type: 'text',
        x: snapX,
        y: snapY,
        width: 180,
        height: 40,
        text: 'Type something...',
        fontSize,
        fontFamily: styleState.fontFamily,
        textAlign: styleState.textAlign,
        color: styleState.color,
      };
      setShapes((prev) => [...prev, newText]);
      setSelectedIds([newText.id]);
      setEditingTextId(newText.id);
      setActiveTool('select');
      onCommitHistory();
      return;
    }

    if (activeTool === 'sticky') {
      const newSticky: StickyShape = {
        id: uid(),
        type: 'sticky',
        x: snapX - 100,
        y: snapY - 100,
        width: 200,
        height: 200,
        text: 'Add your note here...',
        color: styleState.stickyColor,
        fontSize: 16,
        fontFamily: 'draw',
      };
      setShapes((prev) => [...prev, newSticky]);
      setSelectedIds([newSticky.id]);
      setEditingTextId(newSticky.id);
      setActiveTool('select');
      onCommitHistory();
      return;
    }
  };

  // Pointer Move handler
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;

    if (isPanning) {
      setCamera((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const canvasPt = screenToCanvas(e.clientX, e.clientY, rect, camera);
    const snapX = snapToGrid ? snapCoord(canvasPt.x) : canvasPt.x;
    const snapY = snapToGrid ? snapCoord(canvasPt.y) : canvasPt.y;

    if (activeTool === 'laser' && (e.buttons === 1 || e.pressure > 0)) {
      laserTrailRef.current.push({ x: canvasPt.x, y: canvasPt.y, timestamp: Date.now() });
      return;
    }

    if (activeTool === 'eraser' && e.buttons === 1) {
      const hit = shapes.filter((s) => !erasedIdsRef.current.has(s.id) && hitTestShape(canvasPt, s, 16));
      if (hit.length > 0) {
        const hitIds = new Set(hit.map((h) => h.id));
        setShapes((prev) => prev.filter((s) => !hitIds.has(s.id)));
        hitIds.forEach((id) => erasedIdsRef.current.add(id));
      }
      return;
    }

    // Handle resizing existing shape
    if (activeHandle && resizeInitialBounds) {
      const selected = shapes.filter((s) => selectedIds.includes(s.id));
      if (selected.length === 1) {
        const s = selected[0];
        let newX = s.x;
        let newY = s.y;
        let newW = 'width' in s ? s.width : 50;
        let newH = 'height' in s ? s.height : 50;

        if (activeHandle === 'se') {
          newW = Math.max(20, snapX - s.x);
          newH = Math.max(20, snapY - s.y);
        } else if (activeHandle === 'e') {
          newW = Math.max(20, snapX - s.x);
        } else if (activeHandle === 's') {
          newH = Math.max(20, snapY - s.y);
        } else if (activeHandle === 'nw') {
          const right = s.x + newW;
          const bottom = s.y + newH;
          newX = Math.min(snapX, right - 20);
          newY = Math.min(snapY, bottom - 20);
          newW = right - newX;
          newH = bottom - newY;
        }

        setShapes((prev) =>
          prev.map((shape) => {
            if (shape.id === s.id && 'width' in shape) {
              return { ...shape, x: newX, y: newY, width: newW, height: newH };
            }
            return shape;
          })
        );
      }
      return;
    }

    // Handle dragging selected shapes
    if (isDraggingShapes) {
      const dx = canvasPt.x - dragStartPoint.x;
      const dy = canvasPt.y - dragStartPoint.y;

      setShapes((prev) =>
        prev.map((s) => {
          const init = initialShapePositions.get(s.id);
          if (!init) return s;
          if (s.isLocked) return s;

          let targetX = init.x + dx;
          let targetY = init.y + dy;
          if (snapToGrid) {
            targetX = snapCoord(targetX);
            targetY = snapCoord(targetY);
          }

          if (s.type === 'arrow' || s.type === 'line') {
            const arrow = s as ArrowShape | LineShape;
            const sX = init.startX !== undefined ? init.startX + dx : arrow.startX;
            const sY = init.startY !== undefined ? init.startY + dy : arrow.startY;
            const eX = init.endX !== undefined ? init.endX + dx : arrow.endX;
            const eY = init.endY !== undefined ? init.endY + dy : arrow.endY;
            return { ...arrow, x: targetX, y: targetY, startX: sX, startY: sY, endX: eX, endY: eY };
          }

          return { ...s, x: targetX, y: targetY };
        })
      );
      return;
    }

    // Handle marquee box drag
    if (marqueeBox) {
      const minX = Math.min(marqueeBox.minX, canvasPt.x);
      const minY = Math.min(marqueeBox.minY, canvasPt.y);
      const maxX = Math.max(marqueeBox.minX, canvasPt.x);
      const maxY = Math.max(marqueeBox.minY, canvasPt.y);
      const currentBox: Bounds = {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
      };
      setMarqueeBox(currentBox);

      // Select shapes within or intersecting box
      const selected = shapes.filter((s) => boundsIntersect(getShapeBounds(s), currentBox)).map((s) => s.id);
      setSelectedIds(selected);
      return;
    }

    // Handle active drawing shape
    if (currentDrawShape) {
      if (currentDrawShape.type === 'draw') {
        const freehand = currentDrawShape as FreehandShape;
        setCurrentDrawShape({
          ...freehand,
          points: [...freehand.points, { x: canvasPt.x, y: canvasPt.y, pressure: e.pressure || 0.5 }],
        });
      } else if (['rectangle', 'ellipse', 'triangle', 'diamond', 'star', 'cloud'].includes(currentDrawShape.type)) {
        const geom = currentDrawShape as GeometricShape;
        const w = snapX - geom.x;
        const h = snapY - geom.y;
        setCurrentDrawShape({
          ...geom,
          width: Math.abs(w),
          height: Math.abs(h),
          x: w < 0 ? snapX : geom.x,
          y: h < 0 ? snapY : geom.y,
        });
      } else if (currentDrawShape.type === 'arrow' || currentDrawShape.type === 'line') {
        const line = currentDrawShape as ArrowShape | LineShape;
        setCurrentDrawShape({
          ...line,
          endX: snapX,
          endY: snapY,
        });
      }
    }
  };

  // Pointer Up handler
  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (activeHandle) {
      setActiveHandle(null);
      setResizeInitialBounds(null);
      onCommitHistory();
      return;
    }

    if (isDraggingShapes) {
      setIsDraggingShapes(false);
      onCommitHistory();
      return;
    }

    if (marqueeBox) {
      setMarqueeBox(null);
      return;
    }

    if (erasedIdsRef.current.size > 0) {
      erasedIdsRef.current.clear();
      onCommitHistory();
    }

    if (currentDrawShape) {
      // Validate shape min size
      let isValid = true;
      if (currentDrawShape.type === 'draw') {
        isValid = (currentDrawShape as FreehandShape).points.length > 1;
      } else if ('width' in currentDrawShape) {
        isValid = currentDrawShape.width > 5 || currentDrawShape.height > 5;
      } else if ('startX' in currentDrawShape) {
        const line = currentDrawShape as ArrowShape | LineShape;
        isValid = Math.hypot(line.endX - line.startX, line.endY - line.startY) > 5;
      }

      if (isValid) {
        setShapes((prev) => [...prev, currentDrawShape]);
        setSelectedIds([currentDrawShape.id]);
        onCommitHistory();
      }

      setCurrentDrawShape(null);
      // Switch back to select if not drawing or eraser
      if (['rectangle', 'ellipse', 'triangle', 'diamond', 'star', 'cloud', 'arrow', 'line'].includes(activeTool)) {
        setActiveTool('select');
      }
    }
  };

  // Touch pinch-to-zoom support for mobile tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchDistanceRef.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchCenterRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistanceRef.current !== null && touchCenterRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = newDist / touchDistanceRef.current;

      const newZoom = Math.min(4.0, Math.max(0.15, camera.z * ratio));
      setCamera((prev) => ({
        ...prev,
        z: newZoom,
      }));
      touchDistanceRef.current = newDist;
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
    touchCenterRef.current = null;
  };

  // Get selected bounding box
  const selectedShapesList = shapes.filter((s) => selectedIds.includes(s.id));
  const combinedSelectionBounds = getCombinedBounds(selectedShapesList);

  // Compute cursor style
  let cursorClass = 'cursor-default';
  if (isPanning || isSpacePressed) cursorClass = isPanning ? 'cursor-grabbing' : 'cursor-grab';
  else if (activeTool === 'hand') cursorClass = 'cursor-grab';
  else if (activeTool === 'draw') cursorClass = 'cursor-crosshair';
  else if (activeTool === 'eraser') cursorClass = 'cursor-pointer';
  else if (activeTool === 'laser') cursorClass = 'cursor-crosshair';
  else if (['rectangle', 'ellipse', 'triangle', 'diamond', 'star', 'cloud', 'arrow', 'line'].includes(activeTool)) cursorClass = 'cursor-crosshair';
  else if (activeTool === 'text') cursorClass = 'cursor-text';

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full overflow-hidden select-none touch-none ${cursorClass} ${
        isDark ? 'bg-[#151517]' : 'bg-[#f8f9fa]'
      }`}
    >
      {/* Background Dot Grid */}
      {showGrid && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dot-grid"
              x={camera.x % (30 * camera.z)}
              y={camera.y % (30 * camera.z)}
              width={30 * camera.z}
              height={30 * camera.z}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={2 * camera.z}
                cy={2 * camera.z}
                r={1.2 * Math.min(1.5, Math.max(0.8, camera.z))}
                fill={isDark ? '#333842' : '#cbd5e1'}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>
      )}

      {/* Main SVG Vector Layer */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.z})`}>
          {/* Render all committed shapes */}
          {shapes.map((shape) => (
            <ShapeSvgItem
              key={shape.id}
              shape={shape}
              isSelected={selectedIds.includes(shape.id)}
              onDoubleClick={() => {
                if (shape.type === 'text' || shape.type === 'sticky') {
                  setEditingTextId(shape.id);
                }
              }}
            />
          ))}

          {/* Render currently drawing in-progress shape */}
          {currentDrawShape && (
            <ShapeSvgItem
              shape={currentDrawShape}
              isSelected={false}
              isDraft
            />
          )}

          {/* Render Selection Bounding Box & Handles */}
          {combinedSelectionBounds && (
            <g className="pointer-events-auto">
              {/* Outer bounding outline */}
              <rect
                x={combinedSelectionBounds.minX - 4}
                y={combinedSelectionBounds.minY - 4}
                width={combinedSelectionBounds.width + 8}
                height={combinedSelectionBounds.height + 8}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={1.5 / camera.z}
                strokeDasharray={`${4 / camera.z} ${3 / camera.z}`}
                rx={4}
              />

              {/* Single shape handles (resize corner) */}
              {selectedShapesList.length === 1 && (
                <>
                  <rect
                    x={combinedSelectionBounds.maxX + 4 - 4 / camera.z}
                    y={combinedSelectionBounds.maxY + 4 - 4 / camera.z}
                    width={8 / camera.z}
                    height={8 / camera.z}
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth={1.5 / camera.z}
                    className="cursor-se-resize"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setActiveHandle('se');
                      setResizeInitialBounds(combinedSelectionBounds);
                    }}
                  />
                  <rect
                    x={combinedSelectionBounds.minX - 4 - 4 / camera.z}
                    y={combinedSelectionBounds.minY - 4 - 4 / camera.z}
                    width={8 / camera.z}
                    height={8 / camera.z}
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth={1.5 / camera.z}
                    className="cursor-nw-resize"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setActiveHandle('nw');
                      setResizeInitialBounds(combinedSelectionBounds);
                    }}
                  />
                </>
              )}
            </g>
          )}

          {/* Render Marquee selection drag box */}
          {marqueeBox && (
            <rect
              x={marqueeBox.minX}
              y={marqueeBox.minY}
              width={marqueeBox.width}
              height={marqueeBox.height}
              fill="rgba(59, 130, 246, 0.12)"
              stroke="#3b82f6"
              strokeWidth={1 / camera.z}
              strokeDasharray={`${4 / camera.z} ${4 / camera.z}`}
              rx={2}
            />
          )}
        </g>
      </svg>

      {/* Laser Pointer Trail HTML5 Canvas Overlay */}
      <canvas
        ref={laserCanvasRef}
        className="absolute inset-0 pointer-events-none z-20"
      />

      {/* In-place Text / Sticky Editing Overlay */}
      {editingTextId && (
        <InlineTextEditor
          shapeId={editingTextId}
          shapes={shapes}
          setShapes={setShapes}
          camera={camera}
          onClose={() => {
            setEditingTextId(null);
            onCommitHistory();
          }}
        />
      )}
    </div>
  );
};

// Render individual SVG shape
const ShapeSvgItem: React.FC<{
  shape: CanvasShape;
  isSelected: boolean;
  isDraft?: boolean;
  onDoubleClick?: () => void;
}> = ({ shape, isSelected, isDraft, onDoubleClick }) => {
  const dash = 'strokeStyle' in shape ? getDashArray(shape.strokeStyle, shape.strokeWidth) : undefined;

  switch (shape.type) {
    case 'draw': {
      const d = pointsToSmoothSvgPath(shape.points);
      return (
        <path
          d={d}
          fill="none"
          stroke={shape.color}
          strokeWidth={shape.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={dash}
          opacity={isDraft ? 0.8 : shape.opacity || 1}
        />
      );
    }
    case 'rectangle': {
      let fillVal = 'none';
      if (shape.fillStyle === 'solid') fillVal = shape.color;
      else if (shape.fillStyle === 'semi') fillVal = `${shape.color}33`;

      return (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          rx={6}
          fill={fillVal}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth}
          strokeDasharray={dash}
          opacity={shape.opacity || 1}
        />
      );
    }
    case 'ellipse': {
      const rx = shape.width / 2;
      const ry = shape.height / 2;
      let fillVal = 'none';
      if (shape.fillStyle === 'solid') fillVal = shape.color;
      else if (shape.fillStyle === 'semi') fillVal = `${shape.color}33`;

      return (
        <ellipse
          cx={shape.x + rx}
          cy={shape.y + ry}
          rx={Math.max(1, rx)}
          ry={Math.max(1, ry)}
          fill={fillVal}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth}
          strokeDasharray={dash}
          opacity={shape.opacity || 1}
        />
      );
    }
    case 'triangle': {
      const p1 = `${shape.x + shape.width / 2},${shape.y}`;
      const p2 = `${shape.x + shape.width},${shape.y + shape.height}`;
      const p3 = `${shape.x},${shape.y + shape.height}`;
      let fillVal = 'none';
      if (shape.fillStyle === 'solid') fillVal = shape.color;
      else if (shape.fillStyle === 'semi') fillVal = `${shape.color}33`;

      return (
        <polygon
          points={`${p1} ${p2} ${p3}`}
          fill={fillVal}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth}
          strokeLinejoin="round"
          strokeDasharray={dash}
        />
      );
    }
    case 'diamond': {
      const p1 = `${shape.x + shape.width / 2},${shape.y}`;
      const p2 = `${shape.x + shape.width},${shape.y + shape.height / 2}`;
      const p3 = `${shape.x + shape.width / 2},${shape.y + shape.height}`;
      const p4 = `${shape.x},${shape.y + shape.height / 2}`;
      let fillVal = 'none';
      if (shape.fillStyle === 'solid') fillVal = shape.color;
      else if (shape.fillStyle === 'semi') fillVal = `${shape.color}33`;

      return (
        <polygon
          points={`${p1} ${p2} ${p3} ${p4}`}
          fill={fillVal}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth}
          strokeLinejoin="round"
          strokeDasharray={dash}
        />
      );
    }
    case 'star': {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      const spikes = 5;
      const outerRadius = Math.min(shape.width, shape.height) / 2;
      const innerRadius = outerRadius * 0.45;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;
      let pts = '';
      for (let i = 0; i < spikes; i++) {
        let x = cx + Math.cos(rot) * outerRadius;
        let y = cy + Math.sin(rot) * outerRadius;
        pts += `${x.toFixed(1)},${y.toFixed(1)} `;
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        pts += `${x.toFixed(1)},${y.toFixed(1)} `;
        rot += step;
      }
      let fillVal = 'none';
      if (shape.fillStyle === 'solid') fillVal = shape.color;
      else if (shape.fillStyle === 'semi') fillVal = `${shape.color}33`;

      return (
        <polygon
          points={pts.trim()}
          fill={fillVal}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth}
          strokeLinejoin="round"
          strokeDasharray={dash}
        />
      );
    }
    case 'cloud': {
      // Friendly cloud / speech bubble shape
      let fillVal = 'none';
      if (shape.fillStyle === 'solid') fillVal = shape.color;
      else if (shape.fillStyle === 'semi') fillVal = `${shape.color}33`;

      const w = shape.width;
      const h = shape.height;
      const x = shape.x;
      const y = shape.y;
      const pathD = `M ${x + w * 0.2} ${y + h * 0.7}
        C ${x} ${y + h * 0.7}, ${x} ${y + h * 0.3}, ${x + w * 0.25} ${y + h * 0.3}
        C ${x + w * 0.25} ${y + h * 0.05}, ${x + w * 0.6} ${y + h * 0.05}, ${x + w * 0.65} ${y + h * 0.25}
        C ${x + w * 0.85} ${y + h * 0.15}, ${x + w} ${y + h * 0.4}, ${x + w * 0.9} ${y + h * 0.7}
        C ${x + w} ${y + h * 0.9}, ${x + w * 0.7} ${y + h}, ${x + w * 0.5} ${y + h * 0.85}
        C ${x + w * 0.3} ${y + h}, ${x + w * 0.15} ${y + h * 0.9}, ${x + w * 0.2} ${y + h * 0.7} Z`;

      return (
        <path
          d={pathD}
          fill={fillVal}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth}
          strokeLinejoin="round"
          strokeDasharray={dash}
        />
      );
    }
    case 'arrow': {
      const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
      const headLen = Math.max(12, shape.strokeWidth * 3);
      const headAngle = Math.PI / 7;
      const x1 = shape.endX - headLen * Math.cos(angle - headAngle);
      const y1 = shape.endY - headLen * Math.sin(angle - headAngle);
      const x2 = shape.endX - headLen * Math.cos(angle + headAngle);
      const y2 = shape.endY - headLen * Math.sin(angle + headAngle);

      return (
        <g>
          <line
            x1={shape.startX}
            y1={shape.startY}
            x2={shape.endX}
            y2={shape.endY}
            stroke={shape.color}
            strokeWidth={shape.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={dash}
          />
          <polygon
            points={`${shape.endX},${shape.endY} ${x1},${y1} ${x2},${y2}`}
            fill={shape.color}
          />
        </g>
      );
    }
    case 'line': {
      return (
        <line
          x1={shape.startX}
          y1={shape.startY}
          x2={shape.endX}
          y2={shape.endY}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dash}
        />
      );
    }
    case 'sticky': {
      const stickyBgColors: Record<string, string> = {
        yellow: '#fef08a',
        blue: '#bae6fd',
        green: '#bbf7d0',
        pink: '#fbcfe8',
        purple: '#e9d5ff',
        orange: '#fed7aa',
      };
      const bg = stickyBgColors[shape.color] || '#fef08a';
      const lines = (shape.text || '').split('\n');

      return (
        <g onDoubleClick={onDoubleClick} className="cursor-pointer pointer-events-auto">
          {/* Post-it shadow & body */}
          <rect
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            rx={8}
            fill={bg}
            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.07))"
          />
          {/* Folded corner bottom-right */}
          <path
            d={`M ${shape.x + shape.width - 22} ${shape.y + shape.height} L ${shape.x + shape.width} ${shape.y + shape.height - 22} L ${shape.x + shape.width - 22} ${shape.y + shape.height - 22} Z`}
            fill="rgba(0,0,0,0.12)"
          />
          <text
            x={shape.x + 16}
            y={shape.y + 36}
            fontFamily="'Shantell Sans', Caveat, cursive"
            fontSize={shape.fontSize}
            fill="#1e293b"
          >
            {lines.map((line, i) => (
              <tspan key={i} x={shape.x + 16} dy={i === 0 ? 0 : '1.35em'}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      );
    }
    case 'text': {
      const fontFam = shape.fontFamily === 'draw' ? "'Shantell Sans', Caveat, cursive" : shape.fontFamily === 'mono' ? 'monospace' : 'sans-serif';
      const textAnchor = shape.textAlign === 'center' ? 'middle' : shape.textAlign === 'right' ? 'end' : 'start';
      const textX = shape.textAlign === 'center' ? shape.x + shape.width / 2 : shape.textAlign === 'right' ? shape.x + shape.width : shape.x;
      const lines = (shape.text || '').split('\n');

      return (
        <text
          x={textX}
          y={shape.y + shape.fontSize}
          fontFamily={fontFam}
          fontSize={shape.fontSize}
          fill={shape.color}
          textAnchor={textAnchor}
          onDoubleClick={onDoubleClick}
          className="cursor-pointer pointer-events-auto"
        >
          {lines.map((line, i) => (
            <tspan key={i} x={textX} dy={i === 0 ? 0 : '1.3em'}>
              {line}
            </tspan>
          ))}
        </text>
      );
    }
    case 'image': {
      return (
        <image
          href={shape.src}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          preserveAspectRatio="none"
        />
      );
    }
    case 'frame': {
      return (
        <g>
          <rect
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            rx={8}
            fill="none"
            stroke={shape.strokeColor || '#94a3b8'}
            strokeWidth={2}
            strokeDasharray="6 4"
          />
          <text
            x={shape.x + 8}
            y={shape.y - 8}
            fontFamily="sans-serif"
            fontSize={12}
            fill="#64748b"
            fontWeight={600}
          >
            {shape.name}
          </text>
        </g>
      );
    }
    default:
      return null;
  }
};

// Inline Text & Sticky Note Editor
const InlineTextEditor: React.FC<{
  shapeId: string;
  shapes: CanvasShape[];
  setShapes: React.Dispatch<React.SetStateAction<CanvasShape[]>>;
  camera: CanvasCamera;
  onClose: () => void;
}> = ({ shapeId, shapes, setShapes, camera, onClose }) => {
  const shape = shapes.find((s) => s.id === shapeId) as TextShape | StickyShape | undefined;
  if (!shape) return null;

  const screenLeft = shape.x * camera.z + camera.x;
  const screenTop = shape.y * camera.z + camera.y;

  return (
    <div
      className="absolute z-50"
      style={{
        left: `${screenLeft}px`,
        top: `${screenTop}px`,
        width: `${shape.width * camera.z}px`,
        height: `${shape.height * camera.z}px`,
      }}
    >
      <textarea
        autoFocus
        value={shape.text}
        onChange={(e) => {
          const newText = e.target.value;
          setShapes((prev) =>
            prev.map((s) => (s.id === shapeId ? { ...s, text: newText } : s))
          );
        }}
        onBlur={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        className={`w-full h-full p-2 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-lg border-2 border-blue-500 shadow-xl resize-none outline-none ${
          shape.fontFamily === 'draw' ? 'font-draw' : shape.fontFamily === 'mono' ? 'font-mono' : 'font-sans'
        }`}
        style={{
          fontSize: `${(shape.fontSize || 18) * camera.z}px`,
          lineHeight: 1.35,
        }}
      />
    </div>
  );
};
