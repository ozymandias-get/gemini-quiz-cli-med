import type { jsPDF } from 'jspdf';

/** İndigo / taş paleti — baskıda yumuşak kontrast */
export const PDF_EXPORT_THEME = {
  accent: [79, 70, 229] as [number, number, number],
  accentMuted: [129, 140, 248] as [number, number, number],
  accentSoft: [238, 242, 255] as [number, number, number],
  headerBg: [252, 252, 254] as [number, number, number],
  cardBg: [255, 255, 255] as [number, number, number],
  text: [28, 25, 23] as [number, number, number],
  muted: [113, 106, 102] as [number, number, number],
  line: [228, 228, 231] as [number, number, number],
  frame: [241, 245, 249] as [number, number, number],
  correctBg: [236, 253, 245] as [number, number, number],
  correctFg: [21, 128, 61] as [number, number, number],
  correctStripe: [52, 211, 153] as [number, number, number],
  wrongBg: [254, 242, 242] as [number, number, number],
  wrongFg: [185, 28, 28] as [number, number, number],
  wrongStripe: [251, 113, 133] as [number, number, number],
  neutralBg: [248, 250, 252] as [number, number, number],
  neutralStripe: [199, 210, 254] as [number, number, number],
  explainBg: [255, 251, 240] as [number, number, number],
  explainBorder: [252, 211, 77] as [number, number, number],
  explainStripe: [245, 158, 11] as [number, number, number],
  explainText: [68, 64, 60] as [number, number, number],
  footer: [156, 150, 146] as [number, number, number],
  badgeRing: [224, 231, 255] as [number, number, number],
} as const;

export type PdfExportRgb = [number, number, number];

export const STRIPE_PT = 1.15;

export function lineHeightPt(fontSize: number): number {
  return fontSize * 1.07;
}

export function setFillRgb(doc: jsPDF, c: PdfExportRgb): void {
  doc.setFillColor(c[0], c[1], c[2]);
}

export function setDrawRgb(doc: jsPDF, c: PdfExportRgb): void {
  doc.setDrawColor(c[0], c[1], c[2]);
}

export function setTextRgb(doc: jsPDF, c: PdfExportRgb): void {
  doc.setTextColor(c[0], c[1], c[2]);
}

/** Soru kartı çerçevesi (çok ince) */
export function strokeCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  c: PdfExportRgb
): void {
  setDrawRgb(doc, c);
  doc.setLineWidth(0.18);
  doc.roundedRect(x, y, w, h, r, r, 'S');
}
