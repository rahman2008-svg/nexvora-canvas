import { Bounds, CanvasCamera, CanvasShape, FreehandShape, Point } from '../types/canvas';

export function uid(): string {
  return 'sh_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
}

export function screenToCanvas(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  camera: CanvasCamera
): Point {
  const screenX = clientX - containerRect.left;
  const screenY = clientY - containerRect.top;
  return {
    x: (screenX - camera.x) / camera.z,
    y: (screenY - camera.y) / camera.z,
  };
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  containerRect: DOMRect,
  camera: CanvasCamera
): Point {
  return {
    x: canvasX * camera.z + camera.x + containerRect.left,
    y: canvasY * camera.z + camera.y + containerRect.top,
  };
}

export function snapCoord(val: number, snapGrid = 20): number {
  return Math.round(val / snapGrid) * snapGrid;
}

export function getShapeBounds(shape: CanvasShape): Bounds {
  switch (shape.type) {
    case 'draw': {
      if (!shape.points || shape.points.length === 0) {
        return { minX: shape.x, minY: shape.y, maxX: shape.x + 10, maxY: shape.y + 10, width: 10, height: 10 };
      }
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of shape.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      const pad = shape.strokeWidth / 2 + 4;
      return {
        minX: minX - pad,
        minY: minY - pad,
        maxX: maxX + pad,
        maxY: maxY + pad,
        width: Math.max(10, maxX - minX + pad * 2),
        height: Math.max(10, maxY - minY + pad * 2),
      };
    }
    case 'arrow':
    case 'line': {
      const minX = Math.min(shape.startX, shape.endX);
      const minY = Math.min(shape.startY, shape.endY);
      const maxX = Math.max(shape.startX, shape.endX);
      const maxY = Math.max(shape.startY, shape.endY);
      const pad = Math.max(16, shape.strokeWidth * 2);
      return {
        minX: minX - pad,
        minY: minY - pad,
        maxX: maxX + pad,
        maxY: maxY + pad,
        width: Math.max(20, maxX - minX + pad * 2),
        height: Math.max(20, maxY - minY + pad * 2),
      };
    }
    case 'rectangle':
    case 'ellipse':
    case 'triangle':
    case 'diamond':
    case 'star':
    case 'cloud':
    case 'text':
    case 'sticky':
    case 'image':
    case 'frame': {
      const minX = shape.x;
      const minY = shape.y;
      const maxX = shape.x + shape.width;
      const maxY = shape.y + shape.height;
      return {
        minX,
        minY,
        maxX,
        maxY,
        width: Math.max(1, shape.width),
        height: Math.max(1, shape.height),
      };
    }
    default:
      return { minX: 0, minY: 0, maxX: 10, maxY: 10, width: 10, height: 10 };
  }
}

export function getCombinedBounds(shapes: CanvasShape[]): Bounds | null {
  if (shapes.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const s of shapes) {
    const b = getShapeBounds(s);
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

export function hitTestShape(point: Point, shape: CanvasShape, tolerance = 10): boolean {
  const bounds = getShapeBounds(shape);
  // Quick rejection if not within expanded bounds
  if (
    point.x < bounds.minX - tolerance ||
    point.x > bounds.maxX + tolerance ||
    point.y < bounds.minY - tolerance ||
    point.y > bounds.maxY + tolerance
  ) {
    return false;
  }

  switch (shape.type) {
    case 'draw': {
      const freehand = shape as FreehandShape;
      const pts = freehand.points;
      if (pts.length < 2) {
        return pts.length === 1 && Math.hypot(point.x - pts[0].x, point.y - pts[0].y) <= tolerance + freehand.strokeWidth;
      }
      const tol = tolerance + freehand.strokeWidth / 2;
      for (let i = 0; i < pts.length - 1; i++) {
        if (distanceToSegment(point.x, point.y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) <= tol) {
          return true;
        }
      }
      return false;
    }
    case 'arrow':
    case 'line': {
      const tol = tolerance + shape.strokeWidth / 2;
      return distanceToSegment(point.x, point.y, shape.startX, shape.startY, shape.endX, shape.endY) <= tol;
    }
    case 'rectangle':
    case 'text':
    case 'sticky':
    case 'image':
    case 'frame': {
      return (
        point.x >= shape.x &&
        point.x <= shape.x + shape.width &&
        point.y >= shape.y &&
        point.y <= shape.y + shape.height
      );
    }
    case 'ellipse': {
      const rx = shape.width / 2;
      const ry = shape.height / 2;
      const cx = shape.x + rx;
      const cy = shape.y + ry;
      if (rx <= 0 || ry <= 0) return false;
      const normX = (point.x - cx) / rx;
      const normY = (point.y - cy) / ry;
      return normX * normX + normY * normY <= 1.05;
    }
    case 'diamond': {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      const dx = Math.abs(point.x - cx) / (shape.width / 2);
      const dy = Math.abs(point.y - cy) / (shape.height / 2);
      return dx + dy <= 1.05;
    }
    case 'triangle':
    case 'star':
    case 'cloud': {
      // General inside bounding box check with slight margin
      return (
        point.x >= shape.x - tolerance &&
        point.x <= shape.x + shape.width + tolerance &&
        point.y >= shape.y - tolerance &&
        point.y <= shape.y + shape.height + tolerance
      );
    }
    default:
      return false;
  }
}

export function boundsIntersect(b1: Bounds, b2: Bounds): boolean {
  return !(
    b2.minX > b1.maxX ||
    b2.maxX < b1.minX ||
    b2.minY > b1.maxY ||
    b2.maxY < b1.minY
  );
}

// Convert points array to smooth SVG path using Catmull-Rom or Quadratic bezier curves
export function pointsToSmoothSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  }
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    path += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }
  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}

// Stroke width translation
export function getStrokePx(size: 's' | 'm' | 'l' | 'xl'): number {
  switch (size) {
    case 's': return 2;
    case 'm': return 3.5;
    case 'l': return 6;
    case 'xl': return 10;
    default: return 3.5;
  }
}

// Font size translation
export function getFontSizePx(size: 's' | 'm' | 'l' | 'xl'): number {
  switch (size) {
    case 's': return 15;
    case 'm': return 22;
    case 'l': return 32;
    case 'xl': return 46;
    default: return 22;
  }
}

// Stroke dasharray translation
export function getDashArray(style: 'draw' | 'solid' | 'dashed' | 'dotted', strokeWidth: number): string | undefined {
  if (style === 'dashed') return `${strokeWidth * 3} ${strokeWidth * 2.5}`;
  if (style === 'dotted') return `${strokeWidth} ${strokeWidth * 2}`;
  return undefined;
}
