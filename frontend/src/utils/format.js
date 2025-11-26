export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  if (Number.isInteger(num)) return String(num);
  // keep up to 2 decimal places, trim trailing zeros
  return parseFloat(num.toFixed(2)).toString();
}

export default formatNumber;
