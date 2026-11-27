export const LANGS = ['en', 'ru', 'az'] as const;

export type Lang = (typeof LANGS)[number];

// Translatable fields are stored as { "en": "...", "ru": "...", "az": "..." }.
// Returns the text in the requested language, falling back to English.
export function localize(value: unknown, lang: Lang): string {
  if (!value || typeof value !== 'object') return '';

  const record = value as Partial<Record<Lang, unknown>>;
  const text = record[lang] ?? record.en;

  return typeof text === 'string' ? text : '';
}

export function localizeOptional(value: unknown, lang: Lang): string | null {
  const text = localize(value, lang);
  return text.length > 0 ? text : null;
}
