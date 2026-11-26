const fs = require('fs');
const path = require('path');
const pool = require('../db');

const IMAGES_DIR = path.join(__dirname, '..', '..', 'public', 'products');
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

class CatalogError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Devuelve la URL pública (o Data URI) de la foto, o null si no hay foto o el archivo no existe. */
function resolveImage(image, baseUrl) {
  if (!image || typeof image !== 'string') return null;
  if (/^(https?:\/\/|data:image\/)/i.test(image)) return image;
  if (image.startsWith('/uploads/') || image.startsWith('/static/')) {
    return baseUrl ? `${baseUrl}${image}` : image;
  }
  const file = path.basename(image);
  if (!fs.existsSync(path.join(IMAGES_DIR, file))) return null;
  return `${baseUrl}/static/products/${encodeURIComponent(file)}`;
}

function mapProductRow(row, baseUrl, { includeInactive = false } = {}) {
  const isActive = row.activo !== false;
  if (!includeInactive && !isActive) return null;

  const price = Number(row.precio);
  const stock = Number(row.stock);
  if (!row.nombre || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock)) {
    console.warn(`[Catalogo] Producto omitido por datos invalidos: ${JSON.stringify(row)}`);
    return null;
  }

  return {
    id: row.codigo_sku || String(row.id),
    dbId: row.id,
    sku: row.codigo_sku,
    name: String(row.nombre),
    category: row.categoria || 'General',
    price: Math.round(price),
    stock: Math.max(0, Math.floor(stock)),
    active: isActive,
    emoji: row.emoji || '🛍️',
    image: resolveImage(row.imagen_url, baseUrl),
    sizes: Array.isArray(row.tallas) ? row.tallas : [],
  };
}

async function fetchProductsWithSizes({ onlyActive = true } = {}) {
  const whereClause = onlyActive ? 'WHERE p.activo IS DISTINCT FROM FALSE' : '';
  const { rows } = await pool.query(
    `SELECT
       p.id,
       p.codigo_sku,
       p.nombre,
       p.categoria,
       p.precio,
       p.stock,
       p.activo,
       p.imagen_url,
       COALESCE(
         json_agg(
           json_build_object('talla', pt.talla, 'stock', pt.stock)
           ORDER BY pt.id
         ) FILTER (WHERE pt.id IS NOT NULL),
         '[]'::json
       ) AS tallas
     FROM productos p
     LEFT JOIN producto_tallas pt ON pt.producto_id = p.id
     ${whereClause}
     GROUP BY p.id
     ORDER BY p.id ASC`
  );
  return rows;
}

/** Lista paginada de productos activos (activo = false los oculta). */
async function listProducts({ page = 0, limit = 6, baseUrl }) {
  const pageNum = Math.max(0, Number(page) || 0);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 6));

  const rawRows = await fetchProductsWithSizes({ onlyActive: true });
  const all = rawRows.map((r) => mapProductRow(r, baseUrl, { includeInactive: false })).filter(Boolean);

  const start = pageNum * limitNum;
  return {
    items: all.slice(start, start + limitNum),
    hasMore: start + limitNum < all.length,
    total: all.length,
  };
}

/** Lista COMPLETA para el panel (incluye los ocultos). */
async function listAllForAdmin(baseUrl) {
  const rawRows = await fetchProductsWithSizes({ onlyActive: false });
  return rawRows.map((r) => mapProductRow(r, baseUrl, { includeInactive: true })).filter(Boolean);
}

/** Valida y limpia los campos editables. En modo parcial solo revisa los que llegan. */
function cleanFields(input = {}, { partial }) {
  const out = {};
  if (!partial || input.name !== undefined || input.nombre !== undefined) {
    const rawName = input.name !== undefined ? input.name : input.nombre;
    const name = String(rawName ?? '').trim();
    if (!name || name.length > 80) {
      throw new CatalogError('El nombre es obligatorio (máximo 80 caracteres).');
    }
    out.name = name;
  }

  if (!partial || input.price !== undefined || input.precio !== undefined) {
    const rawPrice = input.price !== undefined ? input.price : input.precio;
    const price = Number(rawPrice);
    if (!Number.isInteger(price) || price < 0 || price > 10000000) {
      throw new CatalogError('El precio debe ser un número entero entre 0 y 10.000.000.');
    }
    out.price = price;
  }

  if (!partial || input.stock !== undefined) {
    const stock = Number(input.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
      throw new CatalogError('El stock debe ser un número entero entre 0 y 100.000.');
    }
    out.stock = stock;
  }

  if (input.categoria !== undefined || input.category !== undefined) {
    const cat = String(input.categoria ?? input.category ?? '').trim();
    if (cat.length > 50) throw new CatalogError('La categoría es demasiado larga.');
    out.category = cat || 'General';
  }

  if (input.emoji !== undefined) {
    const emoji = String(input.emoji).trim();
    if (emoji.length > 8) throw new CatalogError('El ícono es demasiado largo.');
    out.emoji = emoji || '🛍️';
  }

  const rawActive = input.active !== undefined ? input.active : input.activo;
  if (rawActive !== undefined) {
    if (typeof rawActive !== 'boolean') {
      throw new CatalogError('"active" debe ser verdadero o falso.');
    }
    out.active = rawActive;
  }

  const rawSizes = input.sizes !== undefined ? input.sizes : input.tallas;
  if (rawSizes !== undefined) {
    if (!Array.isArray(rawSizes)) {
      throw new CatalogError('"sizes" debe ser una lista de tallas.');
    }
    const seen = new Set();
    out.sizes = rawSizes.map((s) => {
      const talla = String(s?.talla ?? s?.size ?? '').trim();
      const stock = Number(s?.stock ?? 0);
      if (!talla || talla.length > 20) {
        throw new CatalogError('Cada talla debe tener un nombre válido (máximo 20 caracteres).');
      }
      if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
        throw new CatalogError(`El stock de la talla "${talla}" debe ser un entero entre 0 y 100.000.`);
      }
      const key = talla.toUpperCase();
      if (seen.has(key)) {
        throw new CatalogError(`La talla "${talla}" está repetida.`);
      }
      seen.add(key);
      return { talla, stock };
    });
    if (out.sizes.length > 0) {
      out.stock = out.sizes.reduce((sum, s) => sum + s.stock, 0);
    }
  }

  return out;
}

async function generateNextSku() {
  const { rows } = await pool.query('SELECT codigo_sku FROM productos');
  const max = rows.reduce((m, r) => {
    const match = /^PRD-(\d+)$/i.exec(String(r.codigo_sku || ''));
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `PRD-${String(max + 1).padStart(3, '0')}`;
}

async function findProductByIdentifier(idOrSku) {
  const raw = String(idOrSku || '').trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    const { rows } = await pool.query('SELECT * FROM productos WHERE id = $1 LIMIT 1', [Number(raw)]);
    if (rows[0]) return rows[0];
  }

  const { rows } = await pool.query(
    'SELECT * FROM productos WHERE UPPER(codigo_sku) = UPPER($1) LIMIT 1',
    [raw]
  );
  return rows[0] || null;
}

async function syncProductSizes(client, productId, sizes) {
  await client.query('DELETE FROM producto_tallas WHERE producto_id = $1', [productId]);
  for (const s of sizes) {
    await client.query(
      'INSERT INTO producto_tallas (producto_id, talla, stock) VALUES ($1, $2, $3)',
      [productId, s.talla, s.stock]
    );
  }
}

async function createProduct(input, baseUrl) {
  const fields = cleanFields(input, { partial: false });
  const sku = (input.codigo_sku || input.sku || (await generateNextSku())).trim();
  const category = fields.category || 'General';
  const active = fields.active !== undefined ? fields.active : true;
  const sizes = fields.sizes || [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO productos (codigo_sku, nombre, categoria, precio, stock, activo, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [sku, fields.name, category, fields.price, fields.stock, active, '']
    );
    const created = rows[0];
    if (sizes.length > 0) {
      await syncProductSizes(client, created.id, sizes);
    }
    await client.query('COMMIT');
    return mapProductRow({ ...created, tallas: sizes }, baseUrl, { includeInactive: true });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateProduct(id, input, baseUrl) {
  const existing = await findProductByIdentifier(id);
  if (!existing) throw new CatalogError('Producto no encontrado.', 404);

  const fields = cleanFields(input, { partial: true });
  const nextName = fields.name !== undefined ? fields.name : existing.nombre;
  const nextPrice = fields.price !== undefined ? fields.price : existing.precio;
  const nextStock = fields.stock !== undefined ? fields.stock : existing.stock;
  const nextCategory = fields.category !== undefined ? fields.category : existing.categoria;
  const nextActive = fields.active !== undefined ? fields.active : existing.activo;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE productos
       SET nombre = $1,
           precio = $2,
           stock = $3,
           categoria = $4,
           activo = $5
       WHERE id = $6
       RETURNING *`,
      [nextName, nextPrice, nextStock, nextCategory, nextActive, existing.id]
    );

    if (fields.sizes !== undefined) {
      await syncProductSizes(client, existing.id, fields.sizes);
    }

    const tallasRes = await client.query(
      'SELECT talla, stock FROM producto_tallas WHERE producto_id = $1 ORDER BY id',
      [existing.id]
    );
    await client.query('COMMIT');
    return mapProductRow({ ...rows[0], tallas: tallasRes.rows }, baseUrl, { includeInactive: true });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function detectImageExt(buf) {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 12 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

async function saveProductImage(id, base64, baseUrl) {
  if (!/^[A-Za-z0-9_-]+$/.test(String(id))) throw new CatalogError('Identificador no válido.');
  if (typeof base64 !== 'string' || !base64) throw new CatalogError('No llegó ninguna imagen.');

  const buf = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
  if (buf.length > MAX_IMAGE_BYTES) {
    throw new CatalogError('La imagen pesa más de 3 MB. Usa una más liviana.', 413);
  }

  const ext = detectImageExt(buf);
  if (!ext) throw new CatalogError('Formato no permitido. Usa una imagen JPG, PNG o WEBP.');

  const product = await findProductByIdentifier(id);
  if (!product) throw new CatalogError('Producto no encontrado.', 404);

  const mime = ext === 'jpg' ? 'jpeg' : ext;
  const dataUri = `data:image/${mime};base64,${buf.toString('base64')}`;

  const { rows } = await pool.query(
    'UPDATE productos SET imagen_url = $1 WHERE id = $2 RETURNING *',
    [dataUri, product.id]
  );

  const tallasRes = await pool.query(
    'SELECT talla, stock FROM producto_tallas WHERE producto_id = $1 ORDER BY id',
    [product.id]
  );

  return mapProductRow({ ...rows[0], tallas: tallasRes.rows }, baseUrl, { includeInactive: true });
}

module.exports = {
  listProducts,
  listAllForAdmin,
  createProduct,
  updateProduct,
  saveProductImage,
  CatalogError,
  IMAGES_DIR,
};
