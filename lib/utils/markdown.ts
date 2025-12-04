/**
 * Markdown and text formatting utilities
 */

/**
 * Convert markdown-style formatting to HTML
 * Handles **bold**, `code`, and preserves line breaks
 */
export function formatMarkdown(text: string): string {
  if (!text) return '';
  
  return text
    // Bold: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Inline code: `text` -> <code>text</code>
    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
    // Preserve line breaks
    .replace(/\n/g, '<br/>');
}

/**
 * Extract bold phrases from text with ** markers
 */
export function extractBoldPhrases(text: string): string[] {
  const matches = text.match(/\*\*(.*?)\*\*/g);
  if (!matches) return [];
  
  return matches.map(m => m.replace(/\*\*/g, ''));
}

/**
 * Highlight specific phrases in text
 */
export function highlightPhrases(text: string, phrases: string[]): string {
  let result = text;
  
  for (const phrase of phrases) {
    const regex = new RegExp(`(${escapeRegex(phrase)})`, 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  }
  
  return result;
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Format command for display with OS badge
 */
export function formatCommand(command: string, os: string): string {
  const osBadges: Record<string, string> = {
    all: '🌐 All OS',
    mac: '🍎 Mac',
    windows: '🪟 Windows',
    linux: '🐧 Linux',
  };
  
  return `<div class="command-block">
    <span class="os-badge">${osBadges[os] || '🌐'}</span>
    <code>${command}</code>
  </div>`;
}

/**
 * Strip markdown formatting from text
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * Truncate text to a specific length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Convert text to title case
 */
export function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
