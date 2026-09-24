// ---------- RUT chileno ----------
export const cleanRut = (value = '') => value.replace(/[^0-9kK]/g, '').toUpperCase();

/** Da formato 12.345.678-5 mientras el usuario escribe. */
export const formatRut = (value = '') => {
  const clean = cleanRut(value).slice(0, 9);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${body}-${clean.slice(-1)}`;
};

/** Valida el dígito verificador (módulo 11). */
export const isValidRut = (value = '') => {
  const clean = cleanRut(value);
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const rest = 11 - (sum % 11);
  const expected = rest === 11 ? '0' : rest === 10 ? 'K' : String(rest);
  return expected === dv;
};

// ---------- Moneda (CLP) ----------
// Formateo manual: Intl/toLocaleString no es fiable en todos los motores Android.
export const formatCLP = (amount) =>
  '$' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
