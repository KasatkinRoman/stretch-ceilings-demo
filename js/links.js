// Contact links built from config. Shared by the page generator and the browser.
// Every config value used in a URL is sanitized or encoded here, in one place.

const MAX_LINK_BASE = 'https://max.ru/'; // UNVERIFIED format, see docs/PLACEHOLDERS.md

/** @returns {Readonly<{tel: string, mail: string, whatsapp: string, telegram: string, max: string}>} */
export function contactLinks(config) {
  if (!config || !config.messengers) {
    throw new TypeError('links: config with messengers is required');
  }
  const { phoneHref = '', email = '', messengers } = config;
  const telDigits = String(phoneHref).replace(/[^\d+]/g, '');
  const [user = '', domain = ''] = String(email).split('@');
  return Object.freeze({
    tel: `tel:${telDigits}`,
    mail: `mailto:${encodeURIComponent(user)}@${encodeURIComponent(domain)}`,
    whatsapp: `https://wa.me/${encodeURIComponent(messengers.whatsapp)}`,
    telegram: `https://t.me/${encodeURIComponent(messengers.telegram)}`,
    max: `${MAX_LINK_BASE}${encodeURIComponent(messengers.max)}`,
  });
}

/** WhatsApp chat link with a prefilled message. */
export function whatsappWithText(config, text) {
  return `${contactLinks(config).whatsapp}?text=${encodeURIComponent(text)}`;
}
