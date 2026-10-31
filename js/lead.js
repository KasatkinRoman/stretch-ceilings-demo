// Lead validation and the single submission point. No DOM here.
// When a backend appears, replace the body of submitLead() only.
import { contactLinks, whatsappWithText } from './links.js';

export const PROTOTYPE_NOTICE = 'Прототип: заявка пока не отправляется. Чтобы связаться с нами, используйте кнопку ниже или позвоните.';

export const CHANNELS = Object.freeze([
  Object.freeze({ id: 'call', label: 'Позвонить мне' }),
  Object.freeze({ id: 'telegram', label: 'Telegram' }),
  Object.freeze({ id: 'whatsapp', label: 'WhatsApp' }),
  Object.freeze({ id: 'max', label: 'MAX' }),
]);

export const SUMMARY_PREFIX = 'Расчёт с сайта:';

/** Adds a calculator summary to the comment: keeps the user's own text, replaces an older summary. */
export function mergeComment(current, summary) {
  const own = String(current || '').split(SUMMARY_PREFIX)[0].trim();
  return own ? `${own}\n\n${summary}` : summary;
}

const NAME_MAX = 60;
const COMMENT_MAX = 1000;
// Russian numbers: +7 followed by a code starting with 3, 4, 8 or 9.
const RU_MOBILE_OR_CITY = /^7[3489]\d{9}$/;
const ALLOWED_PHONE_CHARS = /^\+?[\d\s()-]+$/;

/** @param {unknown} raw @returns {string|null} '+7XXXXXXXXXX' or null */
export function normalizePhone(raw) {
  if (typeof raw !== 'string' || !ALLOWED_PHONE_CHARS.test(raw.trim())) {
    return null;
  }
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  const hasPlus = trimmed.startsWith('+');
  const candidate = toRussianDigits(digits, hasPlus);
  return candidate && RU_MOBILE_OR_CITY.test(candidate) ? `+${candidate}` : null;
}

function toRussianDigits(digits, hasPlus) {
  if (digits.length === 10 && !hasPlus) {
    return `7${digits}`;
  }
  if (digits.length !== 11) {
    return null;
  }
  if (digits.startsWith('8') && !hasPlus) {
    return `7${digits.slice(1)}`;
  }
  return digits.startsWith('7') ? digits : null;
}

const asText = (value) => (typeof value === 'string' ? value.trim() : '');
// C0 controls (incl. newlines and tabs) and DEL become spaces, then spaces collapse.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]+/g;
const asSingleLine = (value) => asText(typeof value === 'string' ? value.replace(CONTROL_CHARS, ' ') : '').replace(/ {2,}/g, ' ');

/** @returns {{ok: boolean, errors: Record<string,string>, data?: object}} */
export function validateLead(input) {
  const source = input && typeof input === 'object' ? input : {};
  const name = asSingleLine(source.name);
  const comment = asText(source.comment);
  const phone = normalizePhone(source.phone);
  const channel = CHANNELS.some((c) => c.id === source.channel) ? source.channel : null;
  const checks = [
    ['name', name.length === 0, 'Укажите имя'],
    ['name', name.length > NAME_MAX, `Имя не длиннее ${NAME_MAX} символов`],
    ['phone', phone === null, 'Укажите российский номер, например +7 916 123-45-67'],
    ['comment', comment.length > COMMENT_MAX, `Комментарий не длиннее ${COMMENT_MAX} символов`],
    ['consent', source.consent !== true, 'Нужно согласие на обработку персональных данных'],
    ['channel', channel === null, 'Выберите способ связи'],
  ];
  const errors = Object.fromEntries(checks.filter(([, failed]) => failed).map(([field, , msg]) => [field, msg]));
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, errors: {}, data: Object.freeze({ name, phone, comment, channel }) };
}

export function buildLeadMessage(data, companyName) {
  const lines = [
    `Здравствуйте, ${companyName}! Хочу вызвать замерщика и рассчитать стоимость.`,
    `Имя: ${data.name}`,
    `Телефон: ${data.phone}`,
    data.comment ? `Комментарий: ${data.comment}` : null,
  ];
  return lines.filter(Boolean).join('\n');
}

export function buildChannelLink(channel, message, contacts) {
  const base = contactLinks(contacts);
  const links = {
    call: { href: base.tel, label: 'Позвонить', canPrefill: false },
    whatsapp: { href: whatsappWithText(contacts, message), label: 'Открыть WhatsApp', canPrefill: true },
    telegram: { href: base.telegram, label: 'Открыть Telegram', canPrefill: false },
    max: { href: base.max, label: 'Открыть MAX', canPrefill: false },
  };
  const link = links[channel];
  if (!link) {
    throw new RangeError(`lead: unknown channel "${channel}"`);
  }
  return Object.freeze(link);
}

/**
 * Single submission point. PROTOTYPE: nothing is sent anywhere.
 * Returns sent=false always, so the UI can never claim success.
 */
export function submitLead(input, contacts) {
  if (!contacts || !contacts.messengers || !contacts.companyName) {
    throw new TypeError('lead: contacts with companyName and messengers are required');
  }
  const validation = validateLead(input);
  if (!validation.ok) {
    return { status: 'invalid', sent: false, errors: validation.errors };
  }
  const message = buildLeadMessage(validation.data, contacts.companyName);
  const link = buildChannelLink(validation.data.channel, message, contacts);
  return { status: 'prototype', sent: false, notice: PROTOTYPE_NOTICE, message, link, data: validation.data };
}
