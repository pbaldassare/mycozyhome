/**
 * Content filter to detect and block personal contact information
 * Prevents sharing of phone numbers, emails, and external links
 */

// Patterns to detect contact information
const PHONE_PATTERNS = [
  /(\+?\d{1,4}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g, // International formats
  /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/g, // US format
  /\b\d{2}[\s.-]?\d{4}[\s.-]?\d{4}\b/g, // Italian format
  /\b\d{10,12}\b/g, // Continuous numbers
];

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

const LINK_PATTERNS = [
  /https?:\/\/[^\s]+/gi, // URLs with http/https
  /www\.[^\s]+/gi, // URLs starting with www
  /[a-zA-Z0-9-]+\.(com|it|org|net|io|app|co|info|biz|eu)[^\s]*/gi, // Domain patterns
];

// Words that might be attempts to share contact info
const CONTACT_WORDS = [
  /chiamami/gi,
  /contattami/gi,
  /scrivimi su/gi,
  /whatsapp/gi,
  /telegram/gi,
  /messenger/gi,
  /instagram/gi,
  /facebook/gi,
  /il mio numero/gi,
  /la mia mail/gi,
  /la mia email/gi,
];

export interface ContentFilterResult {
  isBlocked: boolean;
  sanitizedContent: string;
  originalContent: string;
  blockedReasons: string[];
}

export function filterMessageContent(content: string): ContentFilterResult {
  const blockedReasons: string[] = [];
  let sanitizedContent = content;
  let isBlocked = false;

  // Check for phone numbers
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(content)) {
      sanitizedContent = sanitizedContent.replace(pattern, "[numero nascosto]");
      if (!blockedReasons.includes("phone")) {
        blockedReasons.push("phone");
      }
      isBlocked = true;
    }
    pattern.lastIndex = 0; // Reset regex state
  }

  // Check for emails
  if (EMAIL_PATTERN.test(content)) {
    sanitizedContent = sanitizedContent.replace(EMAIL_PATTERN, "[email nascosta]");
    blockedReasons.push("email");
    isBlocked = true;
  }
  EMAIL_PATTERN.lastIndex = 0;

  // Check for links
  for (const pattern of LINK_PATTERNS) {
    if (pattern.test(content)) {
      sanitizedContent = sanitizedContent.replace(pattern, "[link rimosso]");
      if (!blockedReasons.includes("link")) {
        blockedReasons.push("link");
      }
      isBlocked = true;
    }
    pattern.lastIndex = 0;
  }

  // Check for contact-related words (warning only, don't block)
  for (const pattern of CONTACT_WORDS) {
    if (pattern.test(content)) {
      if (!blockedReasons.includes("contact_attempt")) {
        blockedReasons.push("contact_attempt");
      }
    }
    pattern.lastIndex = 0;
  }

  return {
    isBlocked,
    sanitizedContent,
    originalContent: content,
    blockedReasons,
  };
}

export function getBlockedMessage(reasons: string[]): string {
  const messages: string[] = [];
  
  if (reasons.includes("phone")) {
    messages.push("numeri di telefono");
  }
  if (reasons.includes("email")) {
    messages.push("indirizzi email");
  }
  if (reasons.includes("link")) {
    messages.push("link esterni");
  }

  if (messages.length === 0) return "";

  return `Per la tua sicurezza, ${messages.join(", ")} sono stati nascosti. Utilizza solo la chat interna per comunicare.`;
}
