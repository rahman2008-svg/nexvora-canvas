import { Bounds, CanvasPage, CanvasShape } from '../types/canvas';
import { getCombinedBounds, getDashArray, pointsToSmoothSvgPath } from './math';

export function shapeToSvgString(shape: CanvasShape): string {
  const dash = 'strokeStyle' in shape ? getDashArray(shape.strokeStyle, shape.strokeWidth) : undefined;
  const strokeDashAttr = dash ? `stroke-dasharray="${dash}"` : '';

  switch (shape.type) {
    case 'draw': {
      const d = pointsToSmoothSvgPath(shape.points);
      return `<path d="${d}" fill="none" stroke="${shape.color}" stroke-width="${shape.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" ${strokeDashAttr} />`;
    }
    case 'rectangle': {
      let fillVal = 'none';
      if (shape.fillStyle === 'solid') fillVal = shape.color;
      else if (shape.fillStyle === 'semi') fillVal = `${shape.color}33`;

      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="6" fill="${fillVal}" stroke="${shape.color}" stroke-width="${shape.strokeWidth}" ${strokeDashAttr} />`;
    }
    case 'ellipse': {
      const rx = shape.width / 2;
      const ry = shape.height / 2;
      const cx = shape.x + rx;
      const cy = shape.y + ry;
      let fillVal = 'none';
      if (shape.fillStyle === 'solid') fillVal = shape.color;
      else if (shape.fillStyle === 'semi') fillVal = `${shape.color}33`;

      return `<ellipse cx="${cx}" cy="${cy}" rx="${Math.max(1, rx)}" ry="${Math.max(1, ry)}" fill="${fillVal}" stroke="${shape.color}" stroke-width="${shape.strokeWidth}" ${strokeDashAttr} />`;
    }
    case 'triangle': {
      const p1 = `${shape.x + shape.width / 2},${shape.y}`;
      const p2 = `${shape.x + shape.width},${shape.y + shape.height}`;
      const p3 = `${shape.x},${shape.y + shape.height}`;
      let fillVal = 'none';
      if (shape.fillStyle === 'solid') fillVal = shape.color;
      else if (shape.fillStyle === 'semi') fillVal = `${shape.color}33`;

      return `<polygon points="${p1} ${p2} ${p3}" fill="${fillVal}" stroke="${shape.color}" stroke-width="${shape.strokeWidth}" stroke-linejoin="round" ${strokeDashAttr} />`;
    }
    case 'diamond': {
      const p1 = `${shape.x + shape.width / 2},${shape.y}`;
      const p2 = `${shape.x + shape.width},${shape.y + shape.height / 2}`;
      const p3 = `${shape.x + shape.width / 2},${shape.y + shape.height}`;
      const p4 = `${shape.x},${shape.y + shape.height / 2}`;
      let fillVal = 'none';
      if (shape.fillStyle === 'solid') fillVal = shape.color;
      else if (shape.fillStyle === 'semi') fillVal = `${shape.color}33`;

      return `<polygon points="${p1} ${p2} ${p3} ${p4}" fill="${fillVal}" stroke="${shape.color}" stroke-width="${shape.strokeWidth}" stroke-linejoin="round" ${strokeDashAttr} />`;
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

      return `<polygon points="${pts.trim()}" fill="${fillVal}" stroke="${shape.color}" stroke-width="${shape.strokeWidth}" stroke-linejoin="round" ${strokeDashAttr} />`;
    }
    case 'arrow': {
      const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
      const headLen = Math.max(12, shape.strokeWidth * 3);
      const headAngle = Math.PI / 7;
      const x1 = shape.endX - headLen * Math.cos(angle - headAngle);
      const y1 = shape.endY - headLen * Math.sin(angle - headAngle);
      const x2 = shape.endX - headLen * Math.cos(angle + headAngle);
      const y2 = shape.endY - headLen * Math.sin(angle + headAngle);

      return `
        <g>
          <line x1="${shape.startX}" y1="${shape.startY}" x2="${shape.endX}" y2="${shape.endY}" stroke="${shape.color}" stroke-width="${shape.strokeWidth}" stroke-linecap="round" ${strokeDashAttr} />
          <polygon points="${shape.endX},${shape.endY} ${x1},${y1} ${x2},${y2}" fill="${shape.color}" />
        </g>
      `;
    }
    case 'line': {
      return `<line x1="${shape.startX}" y1="${shape.startY}" x2="${shape.endX}" y2="${shape.endY}" stroke="${shape.color}" stroke-width="${shape.strokeWidth}" stroke-linecap="round" ${strokeDashAttr} />`;
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
      const textLines = (shape.text || '').split('\n').map((line, i) =>
        `<tspan x="${shape.x + shape.width / 2}" dy="${i === 0 ? 0 : '1.3em'}">${escapeHtml(line)}</tspan>`
      ).join('');

      return `
        <g>
          <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="6" fill="${bg}" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.08))" />
          <path d="M ${shape.x + shape.width - 20} ${shape.y + shape.height} L ${shape.x + shape.width} ${shape.y + shape.height - 20} L ${shape.x + shape.width - 20} ${shape.y + shape.height - 20} Z" fill="rgba(0,0,0,0.12)" />
          <text x="${shape.x + shape.width / 2}" y="${shape.y + 40}" font-family="'Shantell Sans', Caveat, cursive" font-size="${shape.fontSize}" fill="#1e293b" text-anchor="middle">
            ${textLines}
          </text>
        </g>
      `;
    }
    case 'text': {
      const fontFam = shape.fontFamily === 'draw' ? "'Shantell Sans', Caveat, cursive" : shape.fontFamily === 'mono' ? 'monospace' : 'sans-serif';
      const textAnchor = shape.textAlign === 'center' ? 'middle' : shape.textAlign === 'right' ? 'end' : 'start';
      const textX = shape.textAlign === 'center' ? shape.x + shape.width / 2 : shape.textAlign === 'right' ? shape.x + shape.width : shape.x;
      const textLines = (shape.text || '').split('\n').map((line, i) =>
        `<tspan x="${textX}" dy="${i === 0 ? 0 : '1.3em'}">${escapeHtml(line)}</tspan>`
      ).join('');

      return `<text x="${textX}" y="${shape.y + shape.fontSize}" font-family="${fontFam}" font-size="${shape.fontSize}" fill="${shape.color}" text-anchor="${textAnchor}">${textLines}</text>`;
    }
    case 'image': {
      return `<image href="${shape.src}" x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" preserveAspectRatio="none" />`;
    }
    case 'frame': {
      return `
        <g>
          <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="8" fill="none" stroke="${shape.strokeColor || '#94a3b8'}" stroke-width="2" stroke-dasharray="6 4" />
          <text x="${shape.x + 8}" y="${shape.y - 8}" font-family="sans-serif" font-size="12" fill="#64748b" font-weight="600">${escapeHtml(shape.name)}</text>
        </g>
      `;
    }
    default:
      return '';
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateSvgDocument(shapes: CanvasShape[], isDark = false): { svgString: string; bounds: Bounds } {
  const bounds = getCombinedBounds(shapes) || {
    minX: 0,
    minY: 0,
    maxX: 800,
    maxY: 600,
    width: 800,
    height: 600,
  };

  const padding = 50;
  const viewBoxX = bounds.minX - padding;
  const viewBoxY = bounds.minY - padding;
  const viewBoxW = bounds.width + padding * 2;
  const viewBoxH = bounds.height + padding * 2;

  const bgFill = isDark ? '#151517' : '#ffffff';

  const shapeSvgs = shapes.map(shapeToSvgString).join('\n  ');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}" width="${viewBoxW}" height="${viewBoxH}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&amp;family=Shantell+Sans:wght@400;600&amp;display=swap');
  </style>
  <rect x="${viewBoxX}" y="${viewBoxY}" width="${viewBoxW}" height="${viewBoxH}" fill="${bgFill}" />
  ${shapeSvgs}
</svg>`;

  return { svgString: svg, bounds };
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToSvg(shapes: CanvasShape[], filename = 'nexvora-canvas.svg', isDark = false) {
  const { svgString } = generateSvgDocument(shapes, isDark);
  downloadFile(filename, svgString, 'image/svg+xml;charset=utf-8');
}

export function exportToPng(
  shapes: CanvasShape[],
  filename = 'nexvora-canvas.png',
  isDark = false,
  scale = 2
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const { svgString, bounds } = generateSvgDocument(shapes, isDark);
      const padding = 50;
      const w = (bounds.width + padding * 2) * scale;
      const h = (bounds.height + padding * 2) * scale;

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL_OBJ = window.URL || window.webkitURL || window;
      const blobUrl = URL_OBJ.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        ctx.fillStyle = isDark ? '#151517' : '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob((blob) => {
          URL_OBJ.revokeObjectURL(blobUrl);
          if (blob) {
            const url = URL_OBJ.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL_OBJ.revokeObjectURL(url);
            resolve();
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        }, 'image/png');
      };

      img.onerror = (e) => {
        URL_OBJ.revokeObjectURL(blobUrl);
        reject(e);
      };

      img.src = blobUrl;
    } catch (err) {
      reject(err);
    }
  });
}

export function exportToJson(
  pages: CanvasPage[],
  currentPageId: string,
  filename = 'nexvora-canvas.nexvora'
) {
  const data = {
    appName: 'NexVora Canvas',
    version: '1.0.0',
    creator: 'Prince AR Abdur Rahman',
    publisher: "NexVora Lab's Ofc",
    timestamp: new Date().toISOString(),
    currentPageId,
    pages,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  downloadFile(filename, jsonStr, 'application/json');
}

export async function copySvgToClipboard(shapes: CanvasShape[], isDark = false): Promise<boolean> {
  try {
    const { svgString } = generateSvgDocument(shapes, isDark);
    await navigator.clipboard.writeText(svgString);
    return true;
  } catch (err) {
    console.error('Failed to copy SVG to clipboard', err);
    return false;
  }
}
