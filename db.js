const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'db.json');

function init() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({ products: [], leads: [] }, null, 2));
  }
}

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

// Products
function getAllProducts() {
  return read().products;
}

function getProduct(id) {
  return read().products.find(p => p.id === Number(id)) || null;
}

function addProduct(data) {
  const db = read();
  const product = { id: nextId(db.products), ...data, created_at: new Date().toISOString() };
  db.products.push(product);
  write(db);
  return product;
}

function updateProduct(id, data) {
  const db = read();
  const idx = db.products.findIndex(p => p.id === Number(id));
  if (idx === -1) return null;
  db.products[idx] = { ...db.products[idx], ...data };
  write(db);
  return db.products[idx];
}

function deleteProduct(id) {
  const db = read();
  db.products = db.products.filter(p => p.id !== Number(id));
  write(db);
}

// Leads
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

module.exports = {
  getAllProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  getAllLeads,
  getLead,
  addLead,
  updateLeadStatus,
  deleteLead,
  getLeadCount,
  getProductCount,
  getTodayLeadCount
};
