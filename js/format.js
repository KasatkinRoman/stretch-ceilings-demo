// Shared formatting helpers (used by the browser and by the page generator).

const RUB_FORMAT = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const NUMBER_FORMAT = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

/** 12500 -> "12 500 ₽" (non-breaking spaces) */
export function formatRub(value) {
  return `${RUB_FORMAT.format(value)} ₽`;
}

/** 12.5 -> "12,5" */
export function formatNumber(value) {
  return NUMBER_FORMAT.format(value);
}

/** Russian plural: pluralize(5, ['год', 'года', 'лет']) -> 'лет' */
export function pluralize(count, forms) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms[1];
  }
  return forms[2];
}
