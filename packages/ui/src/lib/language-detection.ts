import hljs from 'highlight.js';

export function detectLanguage(code: string): string {
  const result = hljs.highlightAuto(code);
  return result.language || 'text';
}
