// Show/clear field errors. Error text is tied to inputs via aria-describedby
// (set in markup) and aria-invalid (set here).

function controlsOf(fieldEl) {
  return Array.from(fieldEl.querySelectorAll('input, select, textarea'));
}

export function setFieldError(form, name, message) {
  const fieldEl = form.querySelector(`[data-field="${name}"]`);
  if (!fieldEl) {
    return;
  }
  const slot = fieldEl.querySelector('.field-error');
  if (slot) {
    slot.textContent = message || '';
  }
  controlsOf(fieldEl).forEach((control) => {
    if (message) {
      control.setAttribute('aria-invalid', 'true');
    } else {
      control.removeAttribute('aria-invalid');
    }
  });
}

export function clearErrors(form) {
  form.querySelectorAll('[data-field]').forEach((fieldEl) => setFieldError(form, fieldEl.dataset.field, ''));
}

/** Clears all errors, shows the given ones and returns the first invalid control. */
export function showErrors(form, errors) {
  clearErrors(form);
  Object.entries(errors).forEach(([name, message]) => setFieldError(form, name, message));
  const firstName = Object.keys(errors)[0];
  const firstField = firstName ? form.querySelector(`[data-field="${firstName}"]`) : null;
  return firstField ? controlsOf(firstField)[0] || null : null;
}

/** Small DOM builder: el('p', { class: 'x' }, 'text', childNode). Text is never parsed as HTML. */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  children.filter((c) => c !== null && c !== undefined).forEach((child) => {
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  });
  return node;
}
