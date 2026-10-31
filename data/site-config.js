// Single source of truth for company data.
// PROVIDED BY THE OWNER: companyName, phone, phoneHref, region.
// Everything else is still a PLACEHOLDER. Replace it with the customer's real data,
// then run `npm run build` to regenerate the HTML pages.
// Full list of placeholders: docs/PLACEHOLDERS.md

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }
  return value;
};

export const SITE_CONFIG = deepFreeze({
  // Latin brand name, one word, exactly this spelling.
  companyName: 'PotolokHub',
  siteUrl: 'https://example.com',
  // false while the site holds placeholders: pages get noindex, robots.txt blocks crawlers.
  // Set to true only after every placeholder is replaced, then rebuild.
  indexable: false,
  region: 'Москва и Московская область',
  // City in prepositional case, used in titles: "Натяжные потолки в Москве".
  cityIn: 'в Москве',

  // Social preview. A 1200x630 PNG/JPG is needed for most networks (SVG is a placeholder).
  ogImage: '/img/og-default.svg',
  ogImageAlt: 'PotolokHub — натяжные потолки и стены: схема комнаты со световыми линиями',

  // Owner-provided business phone. Confirm with the client that it is the public number.
  phone: '+7 (926) 658-17-88',
  phoneHref: '+79266581788',
  email: 'info@example.com',

  messengers: {
    // PLACEHOLDERS: it is NOT known whether the business phone has WhatsApp/Telegram/MAX.
    // Do not reuse the phone here until the owner confirms each messenger account.
    // WhatsApp: phone number in international format, digits only
    whatsapp: '70000000000',
    // Telegram: username without @
    telegram: 'telegram_username',
    // MAX: profile/channel id; link format is UNVERIFIED, see docs/PLACEHOLDERS.md
    max: 'max_username',
  },

  workingHours: 'Ежедневно с 9:00 до 21:00',
  // schema.org openingHours format
  openingHoursSchema: 'Mo-Su 09:00-21:00',

  address: 'Адрес офиса или склада — заменить',

  legal: {
    entityName: 'ИП / ООО — указать полное наименование',
    inn: 'ИНН — указать',
    ogrn: 'ОГРН / ОГРНИП — указать',
    legalAddress: 'Юридический адрес — указать',
  },

  // ONE warranty value used on every page. Do not write other numbers anywhere.
  warrantyYears: 5,

  // ONE measurement promise used on every page.
  measureArrival: 'Замерщик приезжает в согласованный день, обычно на следующий день после звонка',
  measurePrice: 'Замер бесплатный и ни к чему не обязывает',

  // ONE prepayment policy used on every page.
  prepayment: 'Без предоплаты: оплата после монтажа и подписания акта',

  // Minimum order amount in RUB (applied by the calculator and stated on the price page).
  minOrder: 5000,

  // Typical installation duration for an apartment room.
  installDuration: 'обычно 1 день на квартиру',

  priceFixed: 'Цена фиксируется в договоре после замера и не меняется при монтаже, если вы не меняете состав работ',
});
