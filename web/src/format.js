const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * @param {number} paise
 * @returns {string}
 */
export function formatMoney(paise) {
  if (!Number.isFinite(paise)) {
    return rupeeFormatter.format(0);
  }

  return rupeeFormatter.format(paise / 100);
}

/**
 * @param {string|number} value
 * @returns {number}
 */ 
export function rupeesToPaise(value) {
  return Math.round(Number(value) * 100);
}

/**
 * @param {string} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
