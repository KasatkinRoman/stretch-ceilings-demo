// Marks that JavaScript is available before first paint (used by CSS for the mobile menu).
// External file instead of an inline script, so a strict CSP without hashes works.
document.documentElement.classList.add('js');
