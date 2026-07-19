const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function query(sql, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res;
  } finally {
    client.release();
  }
}

async function init() {
  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      capacity TEXT DEFAULT '',
      type TEXT DEFAULT '',
      monthly_price NUMERIC DEFAULT 0,
      card_image TEXT DEFAULT '',
      carousel_image TEXT DEFAULT '',
      detail_images JSONB DEFAULT '[]',
      images JSONB DEFAULT '[]',
      description TEXT DEFAULT '',
      features TEXT DEFAULT '',
      specifications TEXT DEFAULT '',
      stock INTEGER DEFAULT 1,
      tiers JSONB DEFAULT '[]',
      use_flat_pricing BOOLEAN DEFAULT false,
      flat_days INTEGER DEFAULT 0,
      flat_price NUMERIC DEFAULT 0,
      extra_day_rate NUMERIC DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      product_id INTEGER DEFAULT 0,
      product_name TEXT DEFAULT '',
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT DEFAULT '',
      message TEXT DEFAULT '',
      status TEXT DEFAULT 'New',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  // Migrate existing table: add new columns if missing
  try {
    await query(`DO $$ BEGIN
      ALTER TABLE products ADD COLUMN card_image TEXT DEFAULT '';
      EXCEPTION WHEN duplicate_column THEN NULL;
    END $$`);
  } catch(e) { console.error('Migration card_image failed:', e.message); }
  try {
    await query(`DO $$ BEGIN
      ALTER TABLE products ADD COLUMN detail_images JSONB DEFAULT '[]';
      EXCEPTION WHEN duplicate_column THEN NULL;
    END $$`);
    } catch(e) { console.error('Migration detail_images failed:', e.message); }
  try {
    await query(`DO $$ BEGIN
      ALTER TABLE products ADD COLUMN carousel_image TEXT DEFAULT '';
      EXCEPTION WHEN duplicate_column THEN NULL;
    END $$`);
  } catch(e) { console.error('Migration carousel_image failed:', e.message); }
  try {
    await query(`DO $$ BEGIN
      ALTER TABLE products ADD COLUMN specifications TEXT DEFAULT '';
      EXCEPTION WHEN duplicate_column THEN NULL;
    END $$`);
  } catch(e) { console.error('Migration specifications failed:', e.message); }
  const { count } = (await query('SELECT COUNT(*) FROM products')).rows[0];
  if (parseInt(count) === 0) {
    const seed = require('./seed');
    seed.run();
  }
}

function rowToProduct(r) {
  const p = { ...r };
  p.monthly_price = parseFloat(p.monthly_price) || 0;
  p.stock = parseInt(p.stock) || 1;
  p.flat_price = parseFloat(p.flat_price) || 0;
  p.extra_day_rate = parseFloat(p.extra_day_rate) || 0;
  try { p.images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []); } catch(e) { p.images = []; }
  try { p.tiers = typeof p.tiers === 'string' ? JSON.parse(p.tiers) : (p.tiers || []); } catch(e) { p.tiers = []; }
  try { p.detail_images = typeof p.detail_images === 'string' ? JSON.parse(p.detail_images) : (p.detail_images || []); } catch(e) { p.detail_images = []; }
  if (!p.card_image && p.image) p.card_image = p.image;
  if (!p.detail_images || !p.detail_images.length) {
    p.detail_images = p.images && p.images.length ? p.images : (p.image ? [p.image] : []);
  }
  p.created_at = p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString();
  delete p.image;
  return p;
}

function rowToLead(r) {
  const l = { ...r };
  l.product_id = parseInt(l.product_id) || 0;
  l.status = l.status || 'New';
  l.created_at = l.created_at ? new Date(l.created_at).toISOString() : new Date().toISOString();
  return l;
}

async function getAllProducts() {
  const { rows } = await query('SELECT * FROM products ORDER BY id');
  return rows.map(rowToProduct);
}

async function getProduct(id) {
  const { rows } = await query('SELECT * FROM products WHERE id = $1', [id]);
  return rows.length ? rowToProduct(rows[0]) : null;
}

async function addProduct(data) {
  const { name, brand, capacity, type, monthly_price, card_image, carousel_image, detail_images, description, features, specifications, stock, tiers, use_flat_pricing, flat_days, flat_price, extra_day_rate } = data;
  const dimgs = detail_images && detail_images.length ? JSON.stringify(detail_images) : '[]';
  const t = tiers && tiers.length ? JSON.stringify(tiers) : '[]';
  try {
    const { rows } = await query(
      'INSERT INTO products (name, brand, capacity, type, monthly_price, card_image, carousel_image, detail_images, description, features, specifications, stock, tiers, use_flat_pricing, flat_days, flat_price, extra_day_rate) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *',
      [name||'', brand||'', capacity||'', type||'', parseFloat(monthly_price)||0, card_image||'', carousel_image||'', dimgs, description||'', features||'', specifications||'', parseInt(stock)||1, t, !!use_flat_pricing, parseInt(flat_days)||0, parseFloat(flat_price)||0, parseFloat(extra_day_rate)||0]
    );
    return rowToProduct(rows[0]);
  } catch (e) {
    if (e.code === '42703') { // undefined_column
      console.error('New columns missing, falling back to legacy insert:', e.message);
      const { rows } = await query(
        'INSERT INTO products (name, brand, capacity, type, monthly_price, description, features, stock, tiers, use_flat_pricing, flat_days, flat_price, extra_day_rate) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *',
        [name||'', brand||'', capacity||'', type||'', parseFloat(monthly_price)||0, description||'', features||'', parseInt(stock)||1, t, !!use_flat_pricing, parseInt(flat_days)||0, parseFloat(flat_price)||0, parseFloat(extra_day_rate)||0]
      );
      return rowToProduct(rows[0]);
    }
    throw e;
  }
}

async function updateProduct(id, data) {
  const existing = await getProduct(id);
  if (!existing) return null;
  const merged = { ...existing, ...data };
  const dimgs = merged.detail_images && merged.detail_images.length ? JSON.stringify(merged.detail_images) : '[]';
  const t = merged.tiers && merged.tiers.length ? JSON.stringify(merged.tiers) : '[]';
  try {
    const { rows } = await query(
      'UPDATE products SET name=$1, brand=$2, capacity=$3, type=$4, monthly_price=$5, card_image=$6, carousel_image=$7, detail_images=$8, description=$9, features=$10, specifications=$11, stock=$12, tiers=$13, use_flat_pricing=$14, flat_days=$15, flat_price=$16, extra_day_rate=$17 WHERE id=$18 RETURNING *',
      [merged.name||'', merged.brand||'', merged.capacity||'', merged.type||'', parseFloat(merged.monthly_price)||0, merged.card_image||'', merged.carousel_image||'', dimgs, merged.description||'', merged.features||'', merged.specifications||'', parseInt(merged.stock)||1, t, !!merged.use_flat_pricing, parseInt(merged.flat_days)||0, parseFloat(merged.flat_price)||0, parseFloat(merged.extra_day_rate)||0, id]
    );
    return rows.length ? rowToProduct(rows[0]) : null;
  } catch (e) {
    if (e.code === '42703') {
      console.error('New columns missing, falling back to legacy update:', e.message);
      const { rows } = await query(
        'UPDATE products SET name=$1, brand=$2, capacity=$3, type=$4, monthly_price=$5, description=$6, features=$7, stock=$8, tiers=$9, use_flat_pricing=$10, flat_days=$11, flat_price=$12, extra_day_rate=$13 WHERE id=$14 RETURNING *',
        [merged.name||'', merged.brand||'', merged.capacity||'', merged.type||'', parseFloat(merged.monthly_price)||0, merged.description||'', merged.features||'', parseInt(merged.stock)||1, t, !!merged.use_flat_pricing, parseInt(merged.flat_days)||0, parseFloat(merged.flat_price)||0, parseFloat(merged.extra_day_rate)||0, id]
      );
      return rows.length ? rowToProduct(rows[0]) : null;
    }
    throw e;
  }
}

async function deleteProduct(id) {
  await query('DELETE FROM products WHERE id = $1', [id]);
}

async function getAllLeads() {
  const { rows } = await query('SELECT * FROM leads ORDER BY id DESC');
  return rows.map(rowToLead);
}

async function getLead(id) {
  const { rows } = await query('SELECT * FROM leads WHERE id = $1', [id]);
  return rows.length ? rowToLead(rows[0]) : null;
}

async function addLead(data) {
  const { product_id, customer_name, phone, address, message, product_name } = data;
  const { rows } = await query(
    'INSERT INTO leads (product_id, customer_name, phone, address, message, product_name, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [parseInt(product_id)||0, customer_name||'', phone||'', address||'', message||'', product_name||'', 'New']
  );
  return rowToLead(rows[0]);
}

async function updateLeadStatus(id, status) {
  const { rows } = await query('UPDATE leads SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  return rows.length ? rowToLead(rows[0]) : null;
}

async function deleteLead(id) {
  await query('DELETE FROM leads WHERE id = $1', [id]);
}

async function getLeadCount() {
  const { rows } = await query('SELECT COUNT(*) FROM leads');
  return { count: parseInt(rows[0].count) };
}

async function getProductCount() {
  const { rows } = await query('SELECT COUNT(*) FROM products');
  return { count: parseInt(rows[0].count) };
}

async function getTodayLeadCount() {
  const { rows } = await query("SELECT COUNT(*) FROM leads WHERE created_at >= NOW()::date");
  return { count: parseInt(rows[0].count) };
}

init().catch(e => { console.error('DB init error:', e.message); });

module.exports = {
  getAllProducts, getProduct, addProduct, updateProduct, deleteProduct,
  getAllLeads, getLead, addLead, updateLeadStatus, deleteLead,
  getLeadCount, getProductCount, getTodayLeadCount
};