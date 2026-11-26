const { calculateMemberDiscount } = require('../services/discountEngine');

async function getDiscount(req, res) {
  try {
    const { subtotal, memberType } = req.body || {};

    if (typeof subtotal !== 'number' || Number.isNaN(subtotal) || subtotal < 0) {
      return res.status(400).json({ error: 'El subtotal debe ser un número válido.' });
    }

    const { rate, amount, total } = calculateMemberDiscount(subtotal, memberType);

    return res.status(200).json({
      subtotal,
      discountRate: rate,
      discountAmount: amount,
      totalToPay: total,
    });
  } catch (error) {
    console.error('Error en getDiscount:', error);
    return res.status(500).json({ error: 'Error interno al calcular el descuento.' });
  }
}

module.exports = { getDiscount };
