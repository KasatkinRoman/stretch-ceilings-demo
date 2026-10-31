// PLACEHOLDER PRICES. Not the customer's real prices.
// Ranges are UNVERIFIED market guesses from docs/competitor-analysis.md
// and must be replaced after the owner confirms them (see docs/PLACEHOLDERS.md).
// All prices are in RUB and include installation unless stated otherwise.

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }
  return value;
};

export const PRICE_NOTE = 'Цены ориентировочные, уточняются на замере';
export const PRICES_STATUS = 'Шаблонные цены, не подтверждены заказчиком';

// Price per m2: canvas + perimeter profile + installation.
export const CEILING_TYPES = deepFreeze([
  { id: 'matte', name: 'Матовый', min: 400, max: 650 },
  { id: 'satin', name: 'Сатиновый', min: 450, max: 700 },
  { id: 'glossy', name: 'Глянцевый', min: 450, max: 750 },
  { id: 'fabric', name: 'Тканевый', min: 1000, max: 1500 },
  { id: 'shadow', name: 'Теневой или парящий', min: 900, max: 1400 },
  { id: 'light-lines', name: 'Со световыми линиями', min: 1100, max: 1500 },
  { id: 'photo', name: 'С фотопечатью', min: 900, max: 1500 },
]);

// Number of corners included in the base price of a room.
export const INCLUDED_CORNERS = 4;

export const CEILING_EXTRAS = deepFreeze({
  spotlight: { name: 'Закладная и установка точечного светильника', unit: 'шт.', min: 350, max: 500 },
  spotlightFixture: { name: 'Точечный светильник (наш)', unit: 'шт.', min: 400, max: 900 },
  chandelier: { name: 'Закладная и подвес люстры', unit: 'шт.', min: 600, max: 900 },
  extraCorner: { name: 'Угол сверх четырёх', unit: 'шт.', min: 150, max: 250 },
  curtainTrack: { name: 'Скрытый карниз (ниша под шторы)', unit: 'м', min: 1200, max: 1800 },
});

// Price per m2 of wall: canvas + frame profile + installation.
export const WALL_TYPES = deepFreeze([
  { id: 'pvc', name: 'ПВХ-плёнка', min: 550, max: 700 },
  { id: 'fabric', name: 'Тканевое полотно', min: 1500, max: 2000 },
]);

export const WALL_EXTRAS = deepFreeze({
  cutout: { name: 'Вывод розетки, выключателя или трубы', unit: 'шт.', min: 250, max: 400 },
});

// What changes the final price (shown next to every price table).
export const PRICE_FACTORS = deepFreeze([
  'тип и производитель полотна',
  'площадь и форма помещения, количество углов',
  'количество светильников, люстр и световых линий',
  'профиль: обычный, теневой, парящий',
  'обход труб, колонн, ниши под шторы',
  'высота потолка и доступ к стенам',
]);
