import type { jsPDF } from 'jspdf';

export const PDF_EXPORT_FONT_FAMILY = 'NotoSans';

function fontUrl(file: string): string {
  const b = import.meta.env.BASE_URL || '/';
  const root = b.endsWith('/') ? b : `${b}/`;
  return `${root}fonts/${file}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export async function embedNotoSans(doc: jsPDF): Promise<void> {
  const regularUrl = fontUrl('NotoSans-Regular.ttf');
  const boldUrl = fontUrl('NotoSans-Bold.ttf');

  const [regRes, boldRes] = await Promise.all([fetch(regularUrl), fetch(boldUrl)]);

  if (!regRes.ok || !boldRes.ok) {
    throw new Error(`PDF fontları bulunamadı (${regularUrl}). public/fonts/ klasörünü kontrol edin.`);
  }

  const regData = await regRes.arrayBuffer();
  const boldData = await boldRes.arrayBuffer();

  doc.addFileToVFS('NotoSans-Regular.ttf', arrayBufferToBase64(regData));
  doc.addFont('NotoSans-Regular.ttf', PDF_EXPORT_FONT_FAMILY, 'normal');
  doc.addFileToVFS('NotoSans-Bold.ttf', arrayBufferToBase64(boldData));
  doc.addFont('NotoSans-Bold.ttf', PDF_EXPORT_FONT_FAMILY, 'bold');

  doc.setFont(PDF_EXPORT_FONT_FAMILY, 'normal');
}
