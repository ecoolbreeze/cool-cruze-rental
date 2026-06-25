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
      images JSONB DEFAULT '[]',
      description TEXT DEFAULT '',
      features TEXT DEFAULT '',
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
  const { name, brand, capacity, type, monthly_price, images, description, features, stock, tiers, use_flat_pricing, flat_days, flat_price, extra_day_rate } = data;
  const imgs = images && images.length ? JSON.stringify(images) : '[]';
  const t = tiers && tiers.length ? JSON.stringify(tiers) : '[]';
  const { rows } = await query(
    'INSERT INTO products (name, brand, capacity, type, monthly_price, images, description, features, stock, tiers, use_flat_pricing, flat_days, flat_price, extra_day_rate) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *',
    [name||'', brand||'', capacity||'', type||'', parseFloat(monthly_price)||0, imgs, description||'', features||'', parseInt(stock)||1, t, !!use_flat_pricing, parseInt(flat_days)||0, parseFloat(flat_price)||0, parseFloat(extra_day_rate)||0]
  );
  return rowToProduct(rows[0]);
}

async function updateProduct(id, data) {
  const existing = await getProduct(id);
  if (!existing) return null;
  const merged = { ...existing, ...data };
  const imgs = merged.images && merged.images.length ? JSON.stringify(merged.images) : '[]';
  const t = merged.tiers && merged.tiers.length ? JSON.stringify(merged.tiers) : '[]';
  const { rows } = await query(
    'UPDATE products SET name=$1, brand=$2, capacity=$3, type=$4, monthly_price=$5, images=$6, description=$7, features=$8, stock=$9, tiers=$10, use_flat_pricing=$11, flat_days=$12, flat_price=$13, extra_day_rate=$14 WHERE id=$15 RETURNING *',
    [merged.name||'', merged.brand||'', merged.capacity||'', merged.type||'', parseFloat(merged.monthly_price)||0, imgs, merged.description||'', merged.features||'', parseInt(merged.stock)||1, t, !!merged.use_flat_pricing, parseInt(merged.flat_days)||0, parseFloat(merged.flat_price)||0, parseFloat(merged.extra_day_rate)||0, id]
  );
  return rows.length ? rowToProduct(rows[0]) : null;
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