// One short sentence for the calculator status region (screen readers). Pure, no DOM.
import { formatRub } from './format.js';

export const FIELD_LABELS = Object.freeze({
  area: 'Площадь',
  typeId: 'Тип потолка',
  spotlights: 'Точечные светильники',
  chandeliers: 'Люстры',
  corners: 'Углы',
  curtainLength: 'Скрытый карниз',
  materialId: 'Материал',
  cutouts: 'Розетки и выводы',
});

export function calcStatusMessage(result) {
  if (!result) {
    return '';
  }
  if (!result.ok) {
    return Object.entries(result.errors)
      .map(([field, message]) => `Ошибка: ${FIELD_LABELS[field] || field} — ${message}.`)
      .join(' ');
  }
  const range = `Ориентировочная стоимость: от ${formatRub(result.min)} до ${formatRub(result.max)}.`;
  return result.minOrderApplied ? `${range} Применён минимальный заказ ${formatRub(result.minOrder)}.` : range;
}
