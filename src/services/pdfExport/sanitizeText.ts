export function sanitizeTextForPdf(text: string): string {
  if (!text) return '';

  let clean = text.replace(/\*\*/g, '');

  const map: Record<string, string> = {
    '💡': 'Info: ',
    '✨': '*',
    '✅': '(D)',
    '❌': '(Y)',
    '–': '-',
    '—': '-',
    '\u2019': "'",
    '\u2018': "'",
    '\u201C': '"',
    '\u201D': '"',
  };

  Object.keys(map).forEach((key) => {
    clean = clean.split(key).join(map[key]);
  });

  return clean;
}
