/**
 * Sanitization utilities to prevent XSS attacks
 */

/**
 * Sanitizes HTML content by stripping potentially dangerous tags and attributes
 */
export const sanitizeHtml = (html: string): string => {
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.textContent = html; // This automatically escapes HTML
  return temp.innerHTML;
};

/**
 * Escapes HTML entities in a string
 */
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Sanitizes user input by removing potential script injections
 */
export const sanitizeUserInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

/**
 * Validates and sanitizes URL inputs
 */
export const sanitizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return '';
    }
    return urlObj.toString();
  } catch {
    return '';
  }
};

/**
 * Safe HTML component props for rendering dynamic content
 */
export const createSafeHtmlProps = (content: string) => ({
  dangerouslySetInnerHTML: { __html: sanitizeHtml(content) }
});