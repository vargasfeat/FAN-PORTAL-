/**
 * MOCK DATA + API SIMULADA
 * Reemplazar cada función por su llamada real (fetch/axios) cuando el backend esté listo.
 * Las firmas y las formas de respuesta ya son las que la UI espera.
 */
import { cleanRut } from '../utils/helpers';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- Usuarios ----------
// Credenciales de prueba -> RUT: 12.345.678-5 | Clave: socio123
const MEMBERS = [
  {
    rut: '12.345.678-5',
    password: 'socio123',
    name: 'Admin',
    memberType: 'Administrador',
    role: 'admin',
    discountRate: 0.15,
  },
];

export async function authenticate(rut, password) {
  await wait(600);
  const member = MEMBERS.find((m) => cleanRut(m.rut) === cleanRut(rut) && m.password === password);
  if (!member) throw new Error('RUT o contraseña incorrectos.');
  const { password: _omit, ...safeMember } = member;
  return safeMember;
}

// ---------- Catálogo ----------
// [nombre, precio CLP, stock, emoji]. Stock 0 => producto agotado (PC-02).
const CATALOG = [
  ['Camiseta Titular 2026', 34990, 12, '👕'],
  ['Camiseta Visitante 2026', 34990, 8, '👕'],
  ['Camiseta Arquero', 36990, 0, '🧤'],
  ['Polerón de Concentración', 42990, 5, '🧥'],
  ['Chaqueta Cortaviento', 45990, 2, '🧥'],
  ['Short Oficial', 19990, 20, '🩳'],
  ['Bufanda Hinchada', 9990, 30, '🧣'],
  ['Gorro de Lana', 12990, 0, '🧶'],
  ['Jockey Clásico', 14990, 15, '🧢'],
  ['Pelota Réplica N°5', 24990, 7, '⚽'],
  ['Mochila Deportiva', 27990, 3, '🎒'],
  ['Calcetas Oficiales (par)', 6990, 40, '🧦'],
  ['Camiseta Retro 1990', 39990, 0, '👕'],
  ['Buzo de Entrenamiento', 49990, 9, '🏃'],
  ['Botella Térmica', 11990, 25, '🥤'],
  ['Bandera Oficial 90x150', 15990, 1, '🚩'],
  ['Polera Niño Titular', 24990, 10, '👕'],
  ['Parka de Invierno', 69990, 4, '🧥'],
];

export const PRODUCTS = CATALOG.map(([name, price, stock, emoji], i) => ({
  id: `P${String(i + 1).padStart(3, '0')}`,
  name,
  price,
  stock,
  emoji,
}));

/** Paginación simulada: el backend real devolverá el mismo formato. */
export async function fetchProducts({ page = 0, limit = 6 } = {}) {
  await wait(700);
  const start = page * limit;
  const items = PRODUCTS.slice(start, start + limit);
  return { items, hasMore: start + limit < PRODUCTS.length };
}

// ---------- Descuento de socio (PC-03) ----------
export async function fetchMemberDiscount(subtotal, discountRate = 0.15) {
  await wait(500);
  return {
    rate: discountRate,
    amount: Math.round(subtotal * discountRate),
  };
}

// ---------- Pago (PC-04) ----------
export async function processPayment({ total }) {
  await wait(1500);
  return {
    ok: true,
    orderId: `FP-${Date.now().toString().slice(-7)}`,
    total,
  };
}
