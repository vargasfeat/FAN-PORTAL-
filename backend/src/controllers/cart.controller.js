
const { calculateMemberDiscount } = require('../services/discountEngine');


function getDiscount(req, res) {
  const { subtotal, memberType } = req.body;

  if (typeof subtotal !== 'number' || subtotal < 0) {
    return res.status(400).json({ error: 'El subtotal debe ser un número válido.' });
  }

  const { rate, amount, total } = calculateMemberDiscount(subtotal, memberType);

  return res.status(200).json({
    subtotal,
    discountRate: rate,
    discountAmount: amount,
    totalToPay: total,
  });
}

module.exports = { getDiscount };
