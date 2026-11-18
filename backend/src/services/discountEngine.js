/**
 * Motor de Reglas de Descuento — Fan Portal
 * PC-03: Calcula el "Descuento de Socio" aplicado automáticamente al carrito.
 *
 * Regla de negocio: todo socio con membresía activa recibe un 15% de descuento
 * sobre el subtotal de su compra. La tasa se mantiene centralizada aquí para
 * que un cambio futuro (ej. tiers de socio) no requiera tocar los controllers.
 */

const DISCOUNT_RULES = {
  SOCIO_ORO: 0.15,
  SOCIO_PLATA: 0.10,
  SOCIO_BASICO: 0.05,
};

const DEFAULT_RATE = DISCOUNT_RULES.SOCIO_ORO; // 15% — regla por defecto del MVP

/**
 * Calcula el descuento de socio sobre un subtotal dado.
 * @param {number} subtotal - Suma de (precio x cantidad) de los ítems del carrito.
 * @param {string} memberType - Tipo de membresía del socio autenticado.
 * @returns {{ rate: number, amount: number, total: number }}
 */
function calculateMemberDiscount(subtotal, memberType = 'SOCIO_ORO') {
  if (subtotal <= 0) {
    return { rate: 0, amount: 0, total: 0 };
  }

  const rate = DISCOUNT_RULES[memberType] ?? DEFAULT_RATE;
  const amount = Math.round(subtotal * rate);
  const total = subtotal - amount;

  return { rate, amount, total };
}

module.exports = { calculateMemberDiscount, DISCOUNT_RULES };
