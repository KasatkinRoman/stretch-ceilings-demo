// Binds calculator forms ([data-calc]) to the pure functions in calc.js.
// Screen readers get one short sentence in [data-calc-status] on change/blur only;
// the visible result panel is not a live region (it updates while typing).
import { calculateCeiling, calculateWall } from './calc.js';
import { formatRub, formatNumber } from './format.js';
import { calcStatusMessage } from './calc-messages.js';
import { clearErrors, showErrors, el } from './form-errors.js';
import { mergeComment, SUMMARY_PREFIX } from './lead.js';
import { SITE_CONFIG } from '../data/site-config.js';
import {
  CEILING_TYPES, CEILING_EXTRAS, INCLUDED_CORNERS, WALL_TYPES, WALL_EXTRAS, PRICE_NOTE,
} from '../data/prices.js';

const CEILING_PRICING = Object.freeze({
  types: CEILING_TYPES, extras: CEILING_EXTRAS, includedCorners: INCLUDED_CORNERS, minOrder: SITE_CONFIG.minOrder,
});
const WALL_PRICING = Object.freeze({ types: WALL_TYPES, extras: WALL_EXTRAS, minOrder: SITE_CONFIG.minOrder });

const INPUT_DELAY_MS = 400;
const INVALID_WHILE_TYPING = 'Проверьте введённые данные — пересчитаем автоматически.';

const CALCULATORS = Object.freeze({
  ceiling: (values) => calculateCeiling(values, CEILING_PRICING),
  teaser: (values) => calculateCeiling(values, CEILING_PRICING),
  wall: (values) => calculateWall(values, WALL_PRICING),
});

function readValues(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const fixtures = form.querySelector('[name="fixturesIncluded"]');
  return { ...data, fixturesIncluded: Boolean(fixtures && fixtures.checked) };
}

function lineText(line) {
  const qty = `${formatNumber(line.quantity)} ${line.unit}`;
  return `${line.label}, ${qty}: ${formatRub(line.min)} – ${formatRub(line.max)}`;
}

export function summaryText(result) {
  const lines = result.lines.map(lineText).join('\n');
  return `${SUMMARY_PREFIX} от ${formatRub(result.min)} до ${formatRub(result.max)}\n${lines}`;
}

function renderResult(panel, result, kind) {
  const minOrderNote = result.minOrderApplied
    ? el('p', { class: 'calc-min' }, `Применён минимальный заказ ${formatRub(result.minOrder)}: работы на меньшую сумму оформляются по минимальной стоимости.`)
    : null;
  const breakdown = kind === 'teaser'
    ? null
    : el('ul', { class: 'calc-lines' }, ...result.lines.map((line) => el('li', {}, lineText(line))));
  const nodes = [
    el('p', { class: 'calc-label' }, `Ориентировочно за ${formatNumber(result.area)} м²`),
    el('p', { class: 'calc-range' }, `${formatRub(result.min)} – ${formatRub(result.max)}`),
    el('p', { class: 'calc-note' }, `${PRICE_NOTE}. Точная сумма — в договоре после замера.`),
    minOrderNote,
    breakdown,
  ];
  // replaceChildren() would print null as text, so drop empty slots.
  panel.replaceChildren(...nodes.filter(Boolean));
}

const renderEmpty = (panel, text) => panel.replaceChildren(el('p', { class: 'calc-empty' }, text));

function updateTeaserLink(form, values) {
  const link = form.querySelector('[data-teaser-link]');
  if (link && values.area) {
    const params = new URLSearchParams({ area: values.area, type: values.typeId });
    link.setAttribute('href', `/stretch-ceilings-demo/kalkulyator/?${params}`);
  }
}

/** Returns the calculation result (or null for an empty form) and updates the visible panel. */
function recalculate(form, ui, announce) {
  const values = readValues(form);
  if (!String(values.area || '').trim()) {
    clearErrors(form);
    renderEmpty(ui.panel, ui.emptyText);
    return null;
  }
  const result = CALCULATORS[form.dataset.calc](values);
  if (!result.ok) {
    // Never leave a stale price next to invalid input.
    renderEmpty(ui.panel, announce ? 'Проверьте поля, отмеченные выше.' : INVALID_WHILE_TYPING);
    if (announce) showErrors(form, result.errors);
    return result;
  }
  clearErrors(form);
  renderResult(ui.panel, result, form.dataset.calc);
  if (form.dataset.calc === 'teaser') updateTeaserLink(form, values);
  return result;
}

function prefillFromUrl(form) {
  const params = new URLSearchParams(window.location.search);
  const area = params.get('area');
  const type = params.get('type');
  const areaInput = form.querySelector('[name="area"]');
  const typeSelect = form.querySelector('[name="typeId"]');
  if (area && areaInput) areaInput.value = area.slice(0, 10);
  if (type && typeSelect && CEILING_TYPES.some((t) => t.id === type)) typeSelect.value = type;
}

/** The transfer button exists once in the markup; it only toggles and reads the latest result. */
function bindTransfer(ui, getResult) {
  const comment = document.getElementById('lead-comment');
  if (!ui.transfer || !comment) return;
  ui.transfer.addEventListener('click', () => {
    const result = getResult();
    if (!result || !result.ok) return;
    comment.value = mergeComment(comment.value, summaryText(result));
    ui.status.textContent = 'Расчёт добавлен в комментарий заявки.';
    document.getElementById('zayavka').scrollIntoView({ block: 'start' });
    const name = document.getElementById('lead-name');
    if (name) name.focus({ preventScroll: true });
  });
}

function initCalculator(form) {
  if (!CALCULATORS[form.dataset.calc]) return;
  const emptyEl = form.querySelector('.calc-empty');
  const ui = {
    panel: form.querySelector('.calc-result'),
    status: form.querySelector('[data-calc-status]') || el('p'),
    transfer: form.querySelector('[data-transfer]'),
    emptyText: emptyEl ? emptyEl.textContent : '',
  };
  let latest = null;
  if (form.dataset.calc === 'ceiling') prefillFromUrl(form);
  const run = (announce) => {
    try {
      latest = recalculate(form, ui, announce);
      if (ui.transfer) ui.transfer.hidden = !(latest && latest.ok);
      if (announce) ui.status.textContent = calcStatusMessage(latest);
    } catch (error) {
      renderEmpty(ui.panel, 'Не удалось посчитать. Позвоните нам — посчитаем по телефону.');
      reportError(error);
    }
  };
  bindTransfer(ui, () => latest);
  let timer = null;
  form.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => run(false), INPUT_DELAY_MS);
  });
  form.addEventListener('change', () => {
    clearTimeout(timer);
    run(true);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    run(true);
  });
  run(false);
}

function reportError(error) {
  // Prototype: surface programming errors in the console only.
  // eslint-disable-next-line no-console
  console.error('calculator error', error);
}

document.querySelectorAll('form[data-calc]').forEach(initCalculator);
