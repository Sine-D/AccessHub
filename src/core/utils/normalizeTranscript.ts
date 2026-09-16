export const normalizeTranscript = (value: string): string =>
  value
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/gu, ' ')
    .replace(/\s+([,.!?;:])/gu, '$1')
    .trim();