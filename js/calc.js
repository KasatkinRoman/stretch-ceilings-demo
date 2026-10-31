// Pure price calculation. No DOM, no global state, no mutation of inputs.
// Pricing data is passed in explicitly (see site/data/prices.js).

export const LIMITS = Object.freeze({
  maxArea: 500,
  maxCount: 200,
  maxLength: 100,
  minCorners: 3,
  areaStep: 0.1,
  priceStep: 100,
});

/** @param {unknown} value @returns {number|null} */
export function parseNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const text = value.trim().replace(',', '.');
  if (text === '' || !/^-?\d+(\.\d+)?$/.test(text)) {
    return null;
  }
  return Number(text);
}

/** Area billed in 0.1 m2 steps, rounded up. */
export function billableArea(area) {
  const steps = Math.ceil(area / LIMITS.areaStep - 1e-9);
  return Math.round(steps * LIMITS.areaStep * 10) / 10;
}

/** Price rounded to the nearest 100 RUB. */
export function roundPrice(value) {
  return Math.round(value / LIMITS.priceStep) * LIMITS.priceStep;
}

function readArea(raw) {
  const area = parseNumber(raw);
  if (area === null || area <= 0) {
    return { error: 'Укажите площадь больше 0 м²' };
  }
  if (area > LIMITS.maxArea) {
    return { error: `Для площади больше ${LIMITS.maxArea} м² нужен индивидуальный расчёт` };
  }
  return { value: billableArea(area) };
}

function readCount(raw, { min = 0, fallback = 0 } = {}) {
  const isEmpty = raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '');
  if (isEmpty) {
    return { value: fallback };
  }
  const count = parseNumber(raw);
  if (count === null || !Number.isInteger(count) || count < min || count > LIMITS.maxCount) {
    return { error: `Нужно целое число от ${min} до ${LIMITS.maxCount}` };
  }
  return { value: count };
}

function readLength(raw) {
  const isEmpty = raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '');
  if (isEmpty) {
    return { value: 0 };
  }
  const length = parseNumber(raw);
  if (length === null || length < 0 || length > LIMITS.maxLength) {
    return { error: `Длина карниза: от 0 до ${LIMITS.maxLength} м` };
  }
  return { value: length };
}

function readType(id, types, message) {
  const type = types.find((item) => item.id === id);
  return type ? { value: type } : { error: message };
}

function collect(fields) {
  const errors = Object.fromEntries(
    Object.entries(fields).filter(([, r]) => r.error).map(([key, r]) => [key, r.error]),
  );
  const values = Object.fromEntries(Object.entries(fields).map(([key, r]) => [key, r.value]));
  return { errors, values, ok: Object.keys(errors).length === 0 };
}

function extraLine(id, extra, quantity) {
  return { id, label: extra.name, quantity, unit: extra.unit, min: extra.min * quantity, max: extra.max * quantity };
}

function summarize(lines, area, minOrder) {
  const rawMin = lines.reduce((sum, line) => sum + line.min, 0);
  const rawMax = lines.reduce((sum, line) => sum + line.max, 0);
  const min = roundPrice(rawMin);
  const max = roundPrice(rawMax);
  return {
    ok: true,
    area,
    lines,
    min: Math.max(min, minOrder),
    max: Math.max(max, minOrder),
    minOrderApplied: min < minOrder,
    minOrder,
  };
}

function assertPricing(pricing, keys) {
  const valid = pricing && keys.every((key) => pricing[key] !== undefined);
  if (!valid) {
    throw new TypeError(`calc: pricing must contain ${keys.join(', ')}`);
  }
}

function assertInput(input) {
  if (!input || typeof input !== 'object') {
    throw new TypeError('calc: input must be an object');
  }
}

function ceilingLines(v, pricing) {
  const { extras, includedCorners } = pricing;
  const type = v.typeId; // holds the resolved type object, keyed by its form field name
  const base = { id: 'base', label: `Полотно и монтаж: ${type.name}`, quantity: v.area, unit: 'м²', min: type.min * v.area, max: type.max * v.area };
  const extraCorners = Math.max(0, v.corners - includedCorners);
  const fixtures = v.fixturesIncluded ? v.spotlights : 0;
  const candidates = [
    extraLine('spotlight', extras.spotlight, v.spotlights),
    extraLine('spotlightFixture', extras.spotlightFixture, fixtures),
    extraLine('chandelier', extras.chandelier, v.chandeliers),
    extraLine('extraCorner', extras.extraCorner, extraCorners),
    extraLine('curtainTrack', extras.curtainTrack, v.curtainLength),
  ];
  return [base, ...candidates.filter((line) => line.quantity > 0)];
}

/**
 * @param {{area, typeId, spotlights?, chandeliers?, corners?, curtainLength?, fixturesIncluded?}} input
 * @param {{types, extras, includedCorners, minOrder}} pricing
 */
export function calculateCeiling(input, pricing) {
  assertPricing(pricing, ['types', 'extras', 'includedCorners', 'minOrder']);
  assertInput(input);
  const parsed = collect({
    area: readArea(input.area),
    typeId: readType(input.typeId, pricing.types, 'Выберите тип потолка'),
    spotlights: readCount(input.spotlights),
    chandeliers: readCount(input.chandeliers),
    corners: readCount(input.corners, { min: LIMITS.minCorners, fallback: pricing.includedCorners }),
    curtainLength: readLength(input.curtainLength),
  });
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }
  const values = { ...parsed.values, fixturesIncluded: input.fixturesIncluded === true };
  return summarize(ceilingLines(values, pricing), values.area, pricing.minOrder);
}

/**
 * @param {{area, materialId, cutouts?}} input
 * @param {{types, extras, minOrder}} pricing
 */
export function calculateWall(input, pricing) {
  assertPricing(pricing, ['types', 'extras', 'minOrder']);
  assertInput(input);
  const parsed = collect({
    area: readArea(input.area),
    materialId: readType(input.materialId, pricing.types, 'Выберите материал'),
    cutouts: readCount(input.cutouts),
  });
  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }
  const { area, materialId: type, cutouts } = parsed.values;
  const base = { id: 'base', label: `Стена и монтаж: ${type.name}`, quantity: area, unit: 'м²', min: type.min * area, max: type.max * area };
  const lines = [base, extraLine('cutout', pricing.extras.cutout, cutouts)].filter((l) => l.quantity > 0);
  return summarize(lines, area, pricing.minOrder);
}
