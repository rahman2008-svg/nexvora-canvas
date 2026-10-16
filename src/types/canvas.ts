export type ToolType =
  | 'select'
  | 'hand'
  | 'draw'
  | 'eraser'
  | 'laser'
  | 'arrow'
  | 'line'
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'cloud'
  | 'text'
  | 'sticky'
  | 'image'
  | 'frame';

export type FillStyle = 'none' | 'semi' | 'solid' | 'pattern';
export type StrokeStyle = 'draw' | 'solid' | 'dashed' | 'dotted';
export type StrokeSize = 's' | 'm' | 'l' | 'xl';
export type FontSize = 's' | 'm' | 'l' | 'xl';
export type FontFamily = 'draw' | 'sans' | 'serif' | 'mono';
export type TextAlign = 'left' | 'center' | 'right';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface BaseShape {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  rotation?: number;
  isLocked?: boolean;
  opacity?: number;
}

export interface FreehandShape extends BaseShape {
  type: 'draw';
  points: Point[];
  color: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
}

export interface GeometricShape extends BaseShape {
  type: 'rectangle' | 'ellipse' | 'triangle' | 'diamond' | 'star' | 'cloud';
  width: number;
  height: number;
  color: string;
  fill: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  text?: string;
}

export interface ArrowShape extends BaseShape {
  type: 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  bend?: number;
  color: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  arrowHeadStart?: boolean;
  arrowHeadEnd?: boolean;
  text?: string;
}

export interface LineShape extends BaseShape {
  type: 'line';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
}

export interface TextShape extends BaseShape {
  type: 'text';
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: FontFamily;
  textAlign: TextAlign;
  color: string;
}

export interface StickyShape extends BaseShape {
  type: 'sticky';
  width: number;
  height: number;
  text: string;
  color: string; // background color token
  fontSize: number;
  fontFamily: FontFamily;
}

export interface ImageShape extends BaseShape {
  type: 'image';
  width: number;
  height: number;
  src: string;
  aspectRatio: number;
}

export interface FrameShape extends BaseShape {
  type: 'frame';
  width: number;
  height: number;
  name: string;
  strokeColor: string;
}

export type CanvasShape =
  | FreehandShape
  | GeometricShape
  | ArrowShape
  | LineShape
  | TextShape
  | StickyShape
  | ImageShape
  | FrameShape;

export interface CanvasCamera {
  x: number;
  y: number;
  z: number; // zoom factor (0.1 to 5.0)
}

export interface CanvasPage {
  id: string;
  name: string;
  shapes: CanvasShape[];
}

export interface StyleState {
  color: string;
  fill: string;
  fillStyle: FillStyle;
  strokeWidth: StrokeSize;
  strokeStyle: StrokeStyle;
  fontFamily: FontFamily;
  fontSize: FontSize;
  textAlign: TextAlign;
  stickyColor: string;
}

export interface LaserPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface DragHandleInfo {
  type: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rot' | 'arrow-start' | 'arrow-end';
  startX: number;
  startY: number;
  initialBounds: Bounds;
  initialShape?: CanvasShape;
}
