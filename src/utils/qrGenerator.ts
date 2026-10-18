import QRCode from 'qrcode';
import { QrStyleOptions } from '../types';

export async function generateQrDataUrl(
  text: string,
  options: Partial<QrStyleOptions> = {},
  size: number = 800
): Promise<string> {
  const fgColor = options.foregroundColor || '#000000';
  const bgColor = options.backgroundColor || '#ffffff';
  const ecLevel = options.errorCorrectionLevel || 'H';
  const margin = options.margin !== undefined ? options.margin : 2;

  // Create an offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: margin,
    errorCorrectionLevel: ecLevel,
    color: {
      dark: fgColor,
      light: bgColor,
    },
  });

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');

  // If center logo is requested, draw a clean video badge in the center
  if (options.showCenterLogo) {
    const badgeSize = size * 0.22;
    const center = size / 2;
    const badgeX = center - badgeSize / 2;
    const badgeY = center - badgeSize / 2;

    // Outer border / background
    ctx.save();
    ctx.beginPath();
    const radius = badgeSize * 0.26;
    ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, radius);
    ctx.fillStyle = bgColor === '#ffffff' ? '#0f172a' : '#ffffff';
    ctx.fill();

    // Subtle border
    ctx.lineWidth = size * 0.01;
    ctx.strokeStyle = fgColor;
    ctx.stroke();

    // Draw play triangle icon
    ctx.beginPath();
    const triSize = badgeSize * 0.42;
    const triX = center - triSize * 0.35;
    const triY = center;
    ctx.moveTo(triX, triY - triSize / 2);
    ctx.lineTo(triX + triSize * 0.85, triY);
    ctx.lineTo(triX, triY + triSize / 2);
    ctx.closePath();
    ctx.fillStyle = bgColor === '#ffffff' ? '#6366f1' : fgColor;
    ctx.fill();

    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

export async function generateQrSvgString(
  text: string,
  options: Partial<QrStyleOptions> = {}
): Promise<string> {
  const fgColor = options.foregroundColor || '#000000';
  const bgColor = options.backgroundColor || '#ffffff';
  const ecLevel = options.errorCorrectionLevel || 'H';
  const margin = options.margin !== undefined ? options.margin : 2;

  return await QRCode.toString(text, {
    type: 'svg',
    margin,
    errorCorrectionLevel: ecLevel,
    color: {
      dark: fgColor,
      light: bgColor,
    },
  });
}

export function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
