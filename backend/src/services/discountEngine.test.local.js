const { calculateMemberDiscount } = require('./discountEngine');

const subtotalEjemplo = 94970;
const resultado = calculateMemberDiscount(subtotalEjemplo, 'SOCIO_ORO');

console.log('--- Simulación de descuento de socio ---');
console.log('Subtotal:           ', resultado.total + resultado.amount);
console.log(`Descuento (${resultado.rate * 100}%):`, resultado.amount);
console.log('Total a pagar:      ', resultado.total);
