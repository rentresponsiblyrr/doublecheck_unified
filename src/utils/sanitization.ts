/**
 * Content Sanitization Utilities for STR Certified
 * Provides XSS protection for user-generated content
 */

import DOMPurify from 'dompurify';

/**
 * Safe HTML rendering configuration
 */
const SAFE_HTML_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'code', 'pre'
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel', 'class', 'id'
  ],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
};

/**
 * Strict text-only configuration
 */
const STRICT_TEXT_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true
};

/**
 * Sanitizes HTML content for safe rendering
 */
export const sanitizeHTML = (dirtyHTML: string): string => {
  if (!dirtyHTML || typeof dirtyHTML !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(dirtyHTML, SAFE_HTML_CONFIG);
};

/**
 * Sanitizes content to plain text only (removes all HTML)
 */
export const sanitizeText = (dirtyText: string): string => {
  if (!dirtyText || typeof dirtyText !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(dirtyText, STRICT_TEXT_CONFIG);
};

/**
 * Sanitizes and truncates text for display
 */
export const sanitizeAndTruncate = (text: string, maxLength: number = 200): string => {
  const cleaned = sanitizeText(text);
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  return cleaned.substring(0, maxLength).trim() + '...';
};

/**
 * Sanitizes URLs to prevent javascript: and other dangerous protocols
 */
export const sanitizeURL = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  // Remove any HTML encoding
  const decoded = decodeURIComponent(url);
  
  // Check for dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
  if (dangerousProtocols.test(decoded)) {
    return '';
  }
  
  // Ensure it's a valid URL format
  try {
    const urlObj = new URL(decoded);
    // Only allow http, https, mailto, tel
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(urlObj.protocol)) {
      return urlObj.toString();
    }
  } catch {
    // If URL parsing fails, treat as relative URL
    if (decoded.startsWith('/') || decoded.startsWith('./') || decoded.startsWith('../')) {
      return decoded;
    }
  }
  
  return '';
};

/**
 * Sanitizes user input for search queries
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') {
    return '';
  }
  
  return query
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 500); // Limit length
};

/**
 * Sanitizes AI-generated content before display
 */
export const sanitizeAIContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // AI content should be treated as potentially containing HTML
  // but we want to be more permissive than user input
  return DOMPurify.sanitize(content, {
    ...SAFE_HTML_CONFIG,
    ALLOWED_TAGS: [
      ...SAFE_HTML_CONFIG.ALLOWED_TAGS,
      'table', 'thead', 'tbody', 'tr', 'td', 'th'
    ]
  });
};

/**
 * Sanitizes JSON data for safe display
 */
export const sanitizeJSONDisplay = (obj: any): string => {
  try {
    const jsonString = JSON.stringify(obj, null, 2);
    return sanitizeText(jsonString);
  } catch {
    return 'Invalid JSON data';
  }
};

/**
 * React component helper for safe HTML rendering
 */
export const createSafeHTML = (content: string) => ({
  __html: sanitizeHTML(content)
});

/**
 * Validates and sanitizes file names
 */
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName || typeof fileName !== 'string') {
    return 'untitled';
  }
  
  return fileName
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid file name characters
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/^\./, '') // Remove leading dots
    .trim()
    .substring(0, 255) // Limit length
    || 'untitled';
};

/**
 * Sanitizes error messages for user display
 */
export const sanitizeErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  
  let message = '';
  if (typeof error === 'string') {
    message = error;
  } else if (error.message) {
    message = error.message;
  } else if (error.toString) {
    message = error.toString();
  } else {
    message = 'An unknown error occurred';
  }
  
  // Remove any potential HTML and sensitive information
  return sanitizeText(message)
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]') // Remove IP addresses
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Remove emails
    .substring(0, 500); // Limit length
};