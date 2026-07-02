const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL) {
  module.exports = require('./db-pg');
} else {
  const dataDir = path.join(__dirname, 'data');
  const dataFile = path.join(dataDir, 'db.json');
  const seedFile = path.join(dataDir, 'seed.json');

  function init() {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(dataFile)) {
      if (fs.existsSync(seedFile)) {
        fs.copyFileSync(seedFile, dataFile);
      } else {
        fs.writeFileSync(dataFile, JSON.stringify({ products: [], leads: [] }, null, 2));
      }
    }
  }

  function getDataFile() { return dataFile; }

  function read() {
    init();
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  }

  function write(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  }

  function nextId(items) {
    return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
  }

  function normalizeProduct(p) {
    if (!p.card_image && p.image) p.card_image = p.image;
    if (!p.detail_images || !p.detail_images.length) {
      p.detail_images = p.images && p.images.length ? p.images : (p.image ? [p.image] : []);
    }
    if (!p.images || !p.images.length) {
      p.images = p.image ? [p.image] : [];
    }
    delete p.image;
    return p;
  }

  function getAllProducts() {
    return read().products.map(normalizeProduct);
  }

  function getProduct(id) {
    const p = read().products.find(p => p.id === Number(id));
    return p ? normalizeProduct(p) : null;
  }

  function addProduct(data) {
    const db = read();
    const product = { id: nextId(db.products), ...data, created_at: new Date().toISOString() };
    if (!product.card_image && product.image) product.card_image = product.image;
    if (!product.detail_images || !product.detail_images.length) {
      product.detail_images = product.images && product.images.length ? product.images : (product.image ? [product.image] : []);
    }
    if (!product.images) product.images = product.image ? [product.image] : [];
    delete product.image;
    db.products.push(product);
    write(db);
    return product;
  }

  function updateProduct(id, data) {
    const db = read();
    const idx = db.products.findIndex(p => p.id === Number(id));
    if (idx === -1) return null;
    const updated = { ...db.products[idx], ...data };
    delete updated.image;
    if (!updated.card_image && updated.image) updated.card_image = updated.image;
    if (!updated.detail_images || !updated.detail_images.length) {
      updated.detail_images = updated.images && updated.images.length ? updated.images : (updated.image ? [updated.image] : []);
    }
    if (!updated.images || !updated.images.length) updated.images = [];
    db.products[idx] = updated;
    write(db);
    return db.products[idx];
  }

  function deleteProduct(id) {
    const db = read();
    db.products = db.products.filter(p => p.id !== Number(id));
    write(db);
  }

  function getAllLeads() {
    return read().leads.map(l => ({ ...l, status: l.status || 'New' }));
  }

  function getLead(id) {
    return read().leads.find(l => l.id === Number(id)) || null;
  }

  function addLead(data) {
    const db = read();
    const lead = { id: nextId(db.leads), ...data, status: data.status || 'New', created_at: new Date().toISOString() };
    db.leads.push(lead);
    write(db);
    return lead;
  }

  function updateLeadStatus(id, status) {
    const db = read();
    const idx = db.leads.findIndex(l => l.id === Number(id));
    if (idx === -1) return null;
    db.leads[idx].status = status;
    write(db);
    return db.leads[idx];
  }

  function deleteLead(id) {
    const db = read();
    db.leads = db.leads.filter(l => l.id !== Number(id));
    write(db);
  }

  function getLeadCount() {
    return { count: read().leads.length };
  }

  function getProductCount() {
    return { count: read().products.length };
  }

  function getTodayLeadCount() {
    const today = new Date().toISOString().split('T')[0];
    const leads = read().leads;
    return { count: leads.filter(l => l.created_at && l.created_at.startsWith(today)).length };
  }

  init();

  module.exports = {
    getAllProducts, getProduct, addProduct, updateProduct, deleteProduct,
    getAllLeads, getLead, addLead, updateLeadStatus, deleteLead,
    getLeadCount, getProductCount, getTodayLeadCount, getDataFile
  };
}