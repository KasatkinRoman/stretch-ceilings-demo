// Binds the lead form to submitLead(). Prototype: nothing is sent; the UI says so explicitly.
import { submitLead } from './lead.js';
import { clearErrors, showErrors, setFieldError, el } from './form-errors.js';
import { SITE_CONFIG } from '../data/site-config.js';

function readLead(form) {
  const data = new FormData(form);
  return {
    name: String(data.get('name') || ''),
    phone: String(data.get('phone') || ''),
    comment: String(data.get('comment') || ''),
    channel: data.get('channel'),
    consent: form.querySelector('[name="consent"]').checked,
  };
}

async function copyText(text, status) {
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = 'Текст скопирован.';
  } catch (error) {
    status.textContent = 'Не удалось скопировать автоматически — выделите текст в поле и скопируйте вручную.';
  }
}

function copyBlock(message) {
  const area = el('textarea', { id: 'lead-message', readonly: '', rows: '5' });
  area.value = message;
  // Own status region, created before any text is put into it.
  const status = el('p', { class: 'hint', role: 'status' });
  const button = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Скопировать текст');
  button.addEventListener('click', () => copyText(message, status));
  return [el('label', { for: 'lead-message' }, 'Текст заявки'), area, button, status];
}

function channelLink(link) {
  if (!link.href.startsWith('http')) {
    return el('a', { class: 'btn btn-primary', href: link.href }, link.label);
  }
  const newTab = el('span', { class: 'visually-hidden' }, ' (в новой вкладке)');
  return el('a', { class: 'btn btn-primary', href: link.href, target: '_blank', rel: 'noopener' }, link.label, newTab);
}

function renderPrototype(box, result) {
  // Not a live region: focus moves to the heading, so it is read once.
  const heading = el('p', { class: 'lead-result-title', tabindex: '-1' }, result.notice);
  const prefillNote = result.data.channel === 'call'
    ? 'Мы не получим заявку автоматически — позвоните нам по кнопке ниже.'
    : result.link.canPrefill
      ? 'Ссылка откроет чат с уже подставленным текстом заявки.'
      : 'Этот мессенджер не позволяет подставить текст — скопируйте его и вставьте в чат.';
  box.replaceChildren(heading, el('p', {}, prefillNote), channelLink(result.link), ...copyBlock(result.message));
  box.classList.add('is-visible');
  heading.focus();
}

function setSummary(form, errors) {
  const summary = form.querySelector('[data-error-summary]');
  if (summary) {
    const messages = Object.values(errors || {});
    summary.textContent = messages.length ? `Проверьте поля: ${messages.join('; ')}` : '';
  }
}

function handleSubmit(form, box) {
  let result;
  try {
    result = submitLead(readLead(form), SITE_CONFIG);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('lead form error', error);
    box.replaceChildren(el('p', { class: 'field-error' }, 'Форма временно не работает. Позвоните нам, пожалуйста.'));
    box.classList.add('is-visible');
    return;
  }
  setSummary(form, result.errors);
  if (result.status === 'invalid') {
    box.replaceChildren();
    box.classList.remove('is-visible');
    const first = showErrors(form, result.errors);
    if (first) first.focus();
    return;
  }
  clearErrors(form);
  renderPrototype(box, result);
}

function initLeadForm(form) {
  const box = form.querySelector('.lead-result');
  const submit = form.querySelector('[data-lead-submit]');
  if (!box || !submit) return;
  submit.disabled = false;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSubmit(form, box);
  });
  form.addEventListener('input', (event) => {
    const fieldEl = event.target.closest('[data-field]');
    if (fieldEl && event.target.getAttribute('aria-invalid') === 'true') {
      setFieldError(form, fieldEl.dataset.field, '');
      if (!form.querySelector('[aria-invalid="true"]')) setSummary(form, {});
    }
  });
}

document.querySelectorAll('form[data-lead-form]').forEach(initLeadForm);
