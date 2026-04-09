import { invoke } from "@tauri-apps/api/core";
import { jsPDF } from "jspdf";
import { QuizState } from "../types";

/** PDF metinleri — `t.pdfExport` ile doldurulur */
export type PdfExportLabels = {
  documentTitle: string;
  fileLabel: string;
  scoreLabel: string;
  scoreDash: string;
  solutionPrefix: string;
  /** Soru kökünden hemen sonra — kutu başlığı */
  analysisHeading: string;
  footerBrand: string;
  pageWord: string;
  resultFileSuffix: string;
};

const FONT_FAMILY = "NotoSans";

/** İndigo / taş paleti — baskıda yumuşak kontrast */
const C = {
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
};

const cleanText = (text: string): string => {
  if (!text) return "";

  let clean = text.replace(/\*\*/g, "");

  const map: Record<string, string> = {
    "💡": "Info: ",
    "✨": "*",
    "✅": "(D)",
    "❌": "(Y)",
    "–": "-",
    "—": "-",
    "’": "'",
    "‘": "'",
    "“": '"',
    "”": '"',
  };

  Object.keys(map).forEach((key) => {
    clean = clean.split(key).join(map[key]);
  });

  return clean;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const arrayBufferToBase64Chunked = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    const end = Math.min(i + chunk, bytes.length);
    binary += String.fromCharCode(...bytes.subarray(i, end));
  }
  return btoa(binary);
};

function isTauriApp(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function fontUrl(file: string): string {
  const b = import.meta.env.BASE_URL || "/";
  const root = b.endsWith("/") ? b : `${b}/`;
  return `${root}fonts/${file}`;
}

async function embedNotoSans(doc: jsPDF): Promise<void> {
  const regularUrl = fontUrl("NotoSans-Regular.ttf");
  const boldUrl = fontUrl("NotoSans-Bold.ttf");

  const [regRes, boldRes] = await Promise.all([fetch(regularUrl), fetch(boldUrl)]);

  if (!regRes.ok || !boldRes.ok) {
    throw new Error(
      `PDF fontları bulunamadı (${regularUrl}). public/fonts/ klasörünü kontrol edin.`
    );
  }

  const regData = await regRes.arrayBuffer();
  const boldData = await boldRes.arrayBuffer();

  doc.addFileToVFS("NotoSans-Regular.ttf", arrayBufferToBase64(regData));
  doc.addFont("NotoSans-Regular.ttf", FONT_FAMILY, "normal");
  doc.addFileToVFS("NotoSans-Bold.ttf", arrayBufferToBase64(boldData));
  doc.addFont("NotoSans-Bold.ttf", FONT_FAMILY, "bold");

  doc.setFont(FONT_FAMILY, "normal");
}

/** PDF soru kutusu — sıkı ama okunaklı */
function lineHeightPt(fontSize: number): number {
  return fontSize * 1.07;
}

const STRIPE_PT = 1.15;

function setFillRgb(doc: jsPDF, c: [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}

function setDrawRgb(doc: jsPDF, c: [number, number, number]) {
  doc.setDrawColor(c[0], c[1], c[2]);
}

function setTextRgb(doc: jsPDF, c: [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

/** Soru kartı çerçevesi (çok ince) */
function strokeCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  c: [number, number, number]
) {
  setDrawRgb(doc, c);
  doc.setLineWidth(0.18);
  doc.roundedRect(x, y, w, h, r, r, "S");
}

/** PDF indirme / kaydetme sonucu — masaüstünde tam yol, tarayıcıda yalnızca dosya adı */
export type PdfExportResult =
  | { kind: "saved"; path: string }
  | { kind: "cancelled" }
  | { kind: "browser"; fileName: string };

export const exportQuizToPDF = async (
  quizState: QuizState,
  fileName: string,
  L: PdfExportLabels
): Promise<PdfExportResult> => {
  // eslint-disable-next-line new-cap
  const doc = new jsPDF({ compress: true });

  await embedNotoSans(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;
  const contentW = pageWidth - margin * 2;
  const maxLineWidth = contentW;

  let yPosition = margin;

  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - margin - 8) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // — Üst şerit: üst aksen çubuğu + sol şerit + kart —
  const titleFs = 12;
  const metaFs = 6.8;
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(titleFs);
  const titleLines = doc.splitTextToSize(cleanText(L.documentTitle), maxLineWidth - 10);
  const lhTitle = lineHeightPt(titleFs);

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(metaFs);
  const n = quizState.questions.length;
  const scorePercent = n > 0 ? Math.round((quizState.score / n) * 100) : 0;
  const scoreText = cleanText(
    n > 0
      ? `${L.fileLabel}: ${fileName}  ·  ${L.scoreLabel}: ${scorePercent}% (${quizState.score}/${n})`
      : `${L.fileLabel}: ${fileName}  ·  ${L.scoreLabel}: ${L.scoreDash}`
  );
  const scoreLines = doc.splitTextToSize(scoreText, maxLineWidth - 10);
  const lhMeta = lineHeightPt(metaFs);

  const headerInnerPad = 2.5;
  const headerRadius = 2;
  const headerAccentW = 2.8;
  const headerH =
    headerInnerPad +
    titleLines.length * lhTitle +
    0.75 +
    scoreLines.length * lhMeta +
    headerInnerPad +
    0.35;

  const hx = margin;
  const hy = margin;
  setFillRgb(doc, C.headerBg);
  doc.roundedRect(hx, hy, contentW, headerH, headerRadius, headerRadius, "F");
  setFillRgb(doc, C.accent);
  doc.roundedRect(hx, hy, headerAccentW, headerH, headerRadius, headerRadius, "F");
  strokeCard(doc, hx, hy, contentW, headerH, headerRadius, C.line);

  setDrawRgb(doc, C.accentMuted);
  doc.setLineWidth(0.25);
  doc.line(hx + headerAccentW + 4, hy + headerH - 1, pageWidth - margin - 4, hy + headerH - 1);

  let yHeader = margin + headerInnerPad + 7;
  setTextRgb(doc, C.text);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(titleFs);
  doc.text(titleLines, pageWidth / 2, yHeader, { align: "center" });
  yHeader += titleLines.length * lhTitle + 0.75;

  setTextRgb(doc, C.muted);
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(metaFs);
  doc.text(scoreLines, pageWidth / 2, yHeader, { align: "center" });
  yPosition = margin + headerH + 2.5;

  const cardInnerPadX = 2.75;
  /** Rozet + halka kartın üst sınırının içinde kalsın */
  const cardTopPad = 4.1;
  const cardBottomPad = 2.25;
  const cardRadius = 2.2;

  quizState.questions.forEach((q, index) => {
    checkPageBreak(22);

    const blockTop = yPosition;
    yPosition += cardTopPad;

    const qNum = index + 1;
    const badgeSize = 4.6;
    const ring = 0.35;
    const badgeX = margin + cardInnerPadX;
    const badgeY = yPosition - 3.35;

    setFillRgb(doc, C.badgeRing);
    doc.roundedRect(
      badgeX - ring,
      badgeY - ring,
      badgeSize + ring * 2,
      badgeSize + ring * 2,
      0.75,
      0.75,
      "F"
    );
    setFillRgb(doc, C.accent);
    doc.roundedRect(badgeX, badgeY, badgeSize, badgeSize, 0.7, 0.7, "F");
    setTextRgb(doc, [255, 255, 255]);
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(6.2);
    doc.text(String(qNum), badgeX + badgeSize / 2, badgeY + 3.45, { align: "center" });

    setTextRgb(doc, C.text);
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(8);
    const qBody = cleanText(q.text);
    const qTextX = margin + cardInnerPadX + badgeSize + 3;
    const splitTitle = doc.splitTextToSize(qBody, pageWidth - margin - cardInnerPadX - (qTextX - margin));
    const lhQ = lineHeightPt(8);
    checkPageBreak(splitTitle.length * lhQ + 3);
    doc.text(splitTitle, qTextX, yPosition);
    yPosition += splitTitle.length * lhQ + 1;

    const expBoxX = margin + cardInnerPadX;
    const expBoxW = contentW - cardInnerPadX * 2;
    const expTextX = margin + cardInnerPadX + STRIPE_PT + 2.5;
    const expPad = 2;
    const analysisTitleFs = 6.85;
    const analysisBodyFs = 6.45;
    const lhHead = lineHeightPt(analysisTitleFs);
    const lhBody = lineHeightPt(analysisBodyFs);

    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(analysisTitleFs);
    const headLines = doc.splitTextToSize(cleanText(L.analysisHeading), expBoxW - STRIPE_PT - 4);
    const expRaw = cleanText(q.explanation);
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(analysisBodyFs);
    const splitExp = doc.splitTextToSize(expRaw, pageWidth - margin - cardInnerPadX - (expTextX - margin));

    const innerPadTop = expPad + 3.2;
    const boxH =
      innerPadTop +
      headLines.length * lhHead +
      0.6 +
      splitExp.length * lhBody +
      expPad +
      1.2;
    const expTop = yPosition - 2;

    checkPageBreak(boxH + 4);

    setFillRgb(doc, C.explainBg);
    doc.roundedRect(expBoxX, expTop, expBoxW, boxH, 1.35, 1.35, "F");
    setFillRgb(doc, C.explainStripe);
    doc.rect(expBoxX, expTop, STRIPE_PT, boxH, "F");
    setDrawRgb(doc, C.explainBorder);
    doc.setLineWidth(0.16);
    doc.roundedRect(expBoxX, expTop, expBoxW, boxH, 1.35, 1.35, "S");

    let yy = expTop + expPad + 3.2;
    setTextRgb(doc, C.explainText);
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(analysisTitleFs);
    headLines.forEach((line) => {
      doc.text(line, expTextX, yy);
      yy += lhHead;
    });
    yy += 0.6;
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(analysisBodyFs);
    splitExp.forEach((line) => {
      doc.text(line, expTextX, yy);
      yy += lhBody;
    });

    yPosition = expTop + boxH + 1.6;

    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(6.9);
    const lh10 = lineHeightPt(6.9);
    const optLineW = contentW - cardInnerPadX * 2 - 14;
    const optRx = 1.1;
    const rowInset = margin + cardInnerPadX;

    q.options.forEach((opt, optIdx) => {
      const isCorrect = optIdx === q.correctAnswerIndex;
      const isSelected = quizState.userAnswers[q.id] === optIdx;

      let bg: [number, number, number] = C.neutralBg;
      let fg: [number, number, number] = C.text;
      let stripe: [number, number, number] = C.neutralStripe;
      let mark = "○";

      if (isSelected && isCorrect) {
        bg = C.correctBg;
        fg = C.correctFg;
        stripe = C.correctStripe;
        mark = "●";
      } else if (isCorrect) {
        bg = C.correctBg;
        fg = C.correctFg;
        stripe = C.correctStripe;
        mark = "✓";
      } else if (isSelected && !isCorrect) {
        bg = C.wrongBg;
        fg = C.wrongFg;
        stripe = C.wrongStripe;
        mark = "✗";
      }

      const letter = String.fromCharCode(65 + optIdx);
      const optClean = cleanText(opt);
      const splitOpt = doc.splitTextToSize(optClean, optLineW);
      const rowH = splitOpt.length * lh10 + 0.45;
      const yRow = yPosition;
      const rowW = contentW - cardInnerPadX * 2;

      setFillRgb(doc, bg);
      doc.roundedRect(rowInset, yRow - 4.35, rowW, rowH, optRx, optRx, "F");
      setFillRgb(doc, stripe);
      doc.rect(rowInset, yRow - 4.35, STRIPE_PT, rowH, "F");

      setTextRgb(doc, fg);
      doc.setFont(FONT_FAMILY, "bold");
      doc.text(`${letter}.`, rowInset + STRIPE_PT + 2, yRow);
      doc.setFont(FONT_FAMILY, "normal");
      doc.text(mark, rowInset + STRIPE_PT + 7.5, yRow);
      doc.text(splitOpt, rowInset + STRIPE_PT + 12, yRow);

      yPosition = yRow + rowH + 0.22;
      checkPageBreak(3);
    });

    setTextRgb(doc, C.text);
    yPosition += 0.35;
    checkPageBreak(8);

    yPosition += cardBottomPad - 1;

    strokeCard(doc, margin, blockTop, contentW, yPosition - blockTop, cardRadius, C.line);

    const isLast = index === quizState.questions.length - 1;
    if (!isLast) {
      setDrawRgb(doc, C.line);
      doc.setLineWidth(0.2);
      doc.setLineDashPattern([0.35, 1.6], 0);
      doc.line(margin + 8, yPosition + 0.4, pageWidth - margin - 8, yPosition + 0.4);
      doc.setLineDashPattern([], 0);
    }
    yPosition += isLast ? 1.2 : 2.6;
  });

  const pageCount = doc.getNumberOfPages();
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(6);
  setTextRgb(doc, C.footer);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    setDrawRgb(doc, C.line);
    doc.setLineWidth(0.15);
    doc.setLineDashPattern([], 0);
    doc.line(margin + 12, pageHeight - 8.5, pageWidth - margin - 12, pageHeight - 8.5);
    doc.text(`${L.footerBrand}  ·  ${L.pageWord} ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 5.5, {
      align: "center",
    });
  }

  const defaultFileName = `${cleanText(fileName).replace(/\s+/g, "_")}_${L.resultFileSuffix}.pdf`;

  if (isTauriApp()) {
    const pdfData = doc.output("arraybuffer") as ArrayBuffer;
    const pdfBase64 = arrayBufferToBase64Chunked(pdfData);
    const savedPath = await invoke<string | null>("save_quiz_pdf", {
      defaultName: defaultFileName,
      pdfBase64,
    });
    return savedPath == null ? { kind: "cancelled" as const } : { kind: "saved" as const, path: savedPath };
  }

  doc.save(defaultFileName);
  return { kind: "browser" as const, fileName: defaultFileName };
};
