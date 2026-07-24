const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./db');

const sharp = require('sharp');
const app = express();
const PORT = process.env.PORT || 3000;
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '917977471369';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'coolcruze2@gmail.com';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || '';
const MJ_APIKEY = process.env.MJ_APIKEY || '';
const MJ_APISECRET = process.env.MJ_APISECRET || '';
const DATABASE_URL = process.env.DATABASE_URL;
const cacheVersion = Date.now();
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || '';
const isPG = !!DATABASE_URL;

// Google Cloud Storage setup
let storageBucket = null;
if (GCS_BUCKET_NAME) {
  const { Storage } = require('@google-cloud/storage');
  const gcs = new Storage();
  storageBucket = gcs.bucket(GCS_BUCKET_NAME);
}

app.use(express.static(path.join(__dirname, 'public')));

// Disable browser caching for HTML pages so updates show immediately
app.use((req, res, next) => {
  if (req.accepts('html') && !req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session store (PostgreSQL for Cloud Run multi-instance)
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'cool-cruze-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
};
if (isPG) {
  const pgSession = require('connect-pg-simple')(session);
  sessionConfig.store = new pgSession({
    conString: DATABASE_URL,
    createTableIfMissing: true
  });
}
app.use(session(sessionConfig));

app.set('view engine', 'ejs');
app.locals.cacheVersion = cacheVersion;
app.set('views', path.join(__dirname, 'views'));

// Upload handling — memory storage, upload to GCS or local disk
const upload = multer({ storage: multer.memoryStorage() });

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

async function saveUpload(file) {
  if (!file) return '';
  const ext = path.extname(file.originalname).toLowerCase();
  const base = Date.now() + '-' + file.originalname.replace(/\s+/g, '_').replace(/\.[^.]+$/, '');
  const webpFilename = base + '.webp';
  const webpBuffer = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();
  if (storageBucket) {
    const blob = storageBucket.file(webpFilename);
    await blob.save(webpBuffer, { contentType: 'image/webp', public: true });
    return `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${webpFilename}`;
  } else {
    fs.writeFileSync(path.join(uploadsDir, webpFilename), webpBuffer);
    return '/uploads/' + webpFilename;
  }
}

async function saveUploads(files) {
  if (!files || !files.length) return [];
  return Promise.all(files.map(f => saveUpload(f)));
}

console.log('MJ_APIKEY=' + (MJ_APIKEY ? '****' : 'MISSING') + ' MJ_APISECRET=' + (MJ_APISECRET ? '****' : 'MISSING') + ' SENDER_EMAIL=' + SENDER_EMAIL + ' NOTIFY_EMAIL=' + NOTIFY_EMAIL);

async function sendEmail(subject, html) {
  if (!MJ_APIKEY || !MJ_APISECRET || !NOTIFY_EMAIL) {
    console.log('Email not sent: missing Mailjet API keys or NOTIFY_EMAIL');
    return;
  }
  const https = require('https');
  const data = JSON.stringify({
    Messages: [{
      From: { Email: SENDER_EMAIL, Name: 'Cool Cruze' },
      To: [{ Email: NOTIFY_EMAIL, Name: 'Admin' }],
      Subject: subject,
      HTMLPart: html
    }]
  });
  const auth = Buffer.from(MJ_APIKEY + ':' + MJ_APISECRET).toString('base64');
  const options = {
    hostname: 'api.mailjet.com',
    port: 443,
    path: '/v3.1/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + auth,
      'Content-Length': Buffer.byteLength(data)
    }
  };
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      console.log('Email sent, status: ' + res.statusCode);
      resolve();
    });
    req.on('error', (e) => { console.error('Email error:', e.message); resolve(); });
    req.write(data);
    req.end();
  });
}

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/admin/login');
}

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// www redirect
app.use((req, res, next) => {
  if (req.headers.host && req.headers.host.startsWith('www.')) {
    return res.redirect(301, 'https://' + req.headers.host.replace('www.', '') + req.url);
  }
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});

app.use((req, res, next) => {
  let canonicalPath = req.path;
  if (canonicalPath.length > 1) canonicalPath = canonicalPath.replace(/\/+$/, '');
  res.locals.currentPath = canonicalPath;
  res.locals.baseUrl = BASE_URL;
  res.locals.whatsappNumber = WHATSAPP_NUMBER;
  res.locals.robotsMeta = req.path.startsWith('/admin') ? 'noindex, nofollow' : 'index, follow';
  const desc = 'Best tower AC rental in Mumbai — Cool Cruze offers heavy-duty commercial tower, portable & ductable ACs on rent. Zero deposit, free installation & 24/7 support. AC rental Mumbai for events, offices & industries.';
  res.locals.metaDescription = desc;
  res.locals.ogImage = '/uploads/hero.png';
  next();
});

const BASE_URL = 'https://coolcruze.in';

app.get('/', asyncRoute(async (req, res) => {
  const products = await db.getAllProducts();
  const featured = [...products].reverse().slice(0, 4);
  res.render('index', {
    title: 'Home',
    metaDescription: 'Premium tower AC rental in Mumbai. Heavy-duty commercial ACs for events, offices & industries. Reliable HVAC support with fast installation & 24/7 service.',
    ogDescription: 'Premium tower AC rental in Mumbai. Commercial cooling solutions for events, offices & industries.',
    featured, products
  });
}));

app.get('/products', asyncRoute(async (req, res) => {
  const products = await db.getAllProducts();
  res.render('products', {
    title: 'Products',
    metaDescription: 'Browse our collection of tower, portable, ductable & cassette ACs for rent. LG, Samsung, Voltas, Daikin — affordable daily rental plans with zero deposit.',
    products
  });
}));

app.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us',
    metaDescription: 'Learn about Cool Cruze — your trusted partner for premium AC rentals. Affordable, reliable, and hassle-free air conditioning solutions.',
  });
});

app.get('/product/:id', asyncRoute(async (req, res) => {
  const product = await db.getProduct(req.params.id);
  if (!product) return res.redirect('/products');
  res.render('product-detail', {
    title: product.name + ' - ' + product.brand + ' ' + product.capacity + ' AC Rental',
    metaDescription: (product.description || '').substring(0, 160) || 'Rent ' + product.name + ' ' + product.brand + ' ' + product.capacity + ' AC from Cool Cruze. Affordable daily rental, zero deposit, free installation.',
    ogDescription: 'Rent ' + product.name + ' by ' + product.brand + '. ₹' + Number(product.monthly_price).toLocaleString() + '/day. Zero deposit, free delivery & maintenance.',
    ogImage: product.card_image || (product.images && product.images.length ? product.images[0] : '/uploads/hero.png'),
    product
  });
}));

app.get('/rent/:id', (req, res) => {
  res.redirect('/product/' + req.params.id);
});

app.post('/rent/:id', asyncRoute(async (req, res) => {
  const product = await db.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { customer_name, phone, address, message } = req.body;
  if (!customer_name || !phone || !address) {
    return res.status(400).json({ error: 'Please fill all required fields' });
  }

  await db.addLead({
    product_id: product.id,
    product_name: product.name,
    customer_name,
    phone,
    address,
    message: message || ''
  });

  sendEmail(`New Rental Lead - ${product.name}`, `<div><h2>New Rental Inquiry - Cool Cruze</h2><p>Product: ${product.name}</p><p>Name: ${customer_name}</p><p>Phone: ${phone}</p><p>Address: ${address}</p><p>Message: ${message || 'N/A'}</p></div>`);

  res.json({
    success: true,
    whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Cool Cruze! I'm interested in renting ${product.name}. My name is ${customer_name}.`)}`
  });
}));

app.get('/admin/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin Login', error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  res.render('admin/login', { title: 'Admin Login', error: 'Invalid credentials' });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

app.get('/admin', requireAuth, asyncRoute(async (req, res) => {
  const [productCount, leadCount, todayLeadCount, recentLeads] = await Promise.all([
    db.getProductCount(),
    db.getLeadCount(),
    db.getTodayLeadCount(),
    db.getAllLeads()
  ]);
  res.render('admin/dashboard', { title: 'Dashboard', productCount: productCount.count, leadCount: leadCount.count, todayLeadCount: todayLeadCount.count, recentLeads: recentLeads.slice(0, 5), req });
}));

app.get('/admin/products', requireAuth, asyncRoute(async (req, res) => {
  const products = await db.getAllProducts();
  res.render('admin/products', { title: 'Manage Products', products });
}));

function parseTiers(body) {
  const mins = body.tier_min;
  const maxs = body.tier_max;
  const prices = body.tier_price;
  if (!mins || !maxs || !prices) return [];
  const tiers = [];
  for (let i = 0; i < mins.length; i++) {
    const mn = parseInt(mins[i]);
    const mx = parseInt(maxs[i]);
    const pr = parseFloat(prices[i]);
    if (!isNaN(mn) && !isNaN(mx) && !isNaN(pr)) {
      tiers.push({ min: mn, max: mx, price: pr });
    }
  }
  return tiers;
}

const prodUpload = upload.any();

function getUploadedFiles(req) {
  return Array.isArray(req.files) ? req.files : [];
}

function getPrimaryUpload(req) {
  const files = getUploadedFiles(req);
  const imageFile = files.find(file => file.fieldname === 'image');
  if (imageFile) return imageFile;
  return files.find(file => file.fieldname === 'card_image' || file.fieldname === 'carousel_image') || null;
}

function getDetailUploads(req) {
  return getUploadedFiles(req).filter(file => file.fieldname === 'detail_images');
}

app.post('/admin/products', requireAuth, prodUpload, asyncRoute(async (req, res) => {
  const { name, brand, capacity, type, monthly_price, description, features, stock, use_flat_pricing, flat_days, flat_price, extra_day_rate } = req.body;
  const uploadFile = getPrimaryUpload(req);
  const imageUrl = uploadFile ? await saveUpload(uploadFile) : '';
  const card_image = imageUrl;
  const detail_images = imageUrl ? [imageUrl] : [];
  const carousel_image = imageUrl;
  const tiers = parseTiers(req.body);
  await db.addProduct({ name, brand, capacity, type, monthly_price: parseFloat(monthly_price), card_image, detail_images, carousel_image, description, features, specifications: req.body.specifications || '', stock: parseInt(stock) || 1, tiers, use_flat_pricing: !!use_flat_pricing, flat_days: parseInt(flat_days) || 0, flat_price: parseFloat(flat_price) || 0, extra_day_rate: parseFloat(extra_day_rate) || 0 });
  res.redirect('/admin/products');
}));

app.post('/admin/products/edit/:id', requireAuth, prodUpload, asyncRoute(async (req, res) => {
  const { name, brand, capacity, type, monthly_price, description, features, stock, use_flat_pricing, flat_days, flat_price, extra_day_rate } = req.body;
  const existing = await db.getProduct(req.params.id);
  if (!existing) return res.redirect('/admin/products');
  const uploadFile = getPrimaryUpload(req);
  const imageUrl = uploadFile ? await saveUpload(uploadFile) : '';
  const card_image = imageUrl || existing.card_image || existing.carousel_image || (existing.detail_images && existing.detail_images[0]) || '';
  const detail_images = imageUrl ? [imageUrl] : (existing.detail_images && existing.detail_images.length ? existing.detail_images : []);
  const carousel_image = imageUrl || existing.carousel_image || existing.card_image || (existing.detail_images && existing.detail_images[0]) || '';
  const tiers = parseTiers(req.body);
  await db.updateProduct(req.params.id, { name, brand, capacity, type, monthly_price: parseFloat(monthly_price), card_image, detail_images, carousel_image, description, features, specifications: req.body.specifications || '', stock: parseInt(stock) || 1, tiers, use_flat_pricing: !!use_flat_pricing, flat_days: parseInt(flat_days) || 0, flat_price: parseFloat(flat_price) || 0, extra_day_rate: parseFloat(extra_day_rate) || 0 });
  res.redirect('/admin/products');
}));

app.post('/admin/products/delete/:id', requireAuth, asyncRoute(async (req, res) => {
  await db.deleteProduct(req.params.id);
  res.redirect('/admin/products');
}));

app.get('/admin/leads', requireAuth, asyncRoute(async (req, res) => {
  const leads = await db.getAllLeads();
  res.render('admin/leads', { title: 'Leads', leads });
}));

app.post('/admin/leads/status/:id', requireAuth, asyncRoute(async (req, res) => {
  await db.updateLeadStatus(req.params.id, req.body.status);
  res.redirect('/admin/leads');
}));

app.post('/admin/leads/delete/:id', requireAuth, asyncRoute(async (req, res) => {
  await db.deleteLead(req.params.id);
  res.redirect('/admin/leads');
}));

// === JSON API endpoints for React frontend ===

function normalizeApiProduct(p) {
  return {
    ...p,
    price_per_day: parseFloat(p.monthly_price) || parseFloat(p.price_per_day) || 0,
    price_per_week: p.price_per_week || Math.round((parseFloat(p.monthly_price) || 0) * 0.9),
    short_desc: p.short_desc || p.description?.substring(0, 100) || ''
  };
}

app.get('/api/products', asyncRoute(async (req, res) => {
  let products = await db.getAllProducts();
  products = products.map(normalizeApiProduct);
  res.json(products);
}));

app.get('/api/products/:id', asyncRoute(async (req, res) => {
  const p = await db.getProduct(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(normalizeApiProduct(p));
}));

app.post('/api/rent/:id', asyncRoute(async (req, res) => {
  const product = await db.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const { name, phone, email, message, months, pricePerDay, totalPrice } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });
  await db.addLead({
    product_id: product.id,
    product_name: product.name,
    customer_name: name,
    phone,
    address: email || '',
    message: `Duration: ${months} days | ₹${totalPrice} | ${message || ''}`
  });
  sendEmail(`New Rental Lead - ${product.name}`, `<div><h2>New Rental Inquiry</h2><p>Product: ${product.name}</p><p>Name: ${name}</p><p>Phone: ${phone}</p><p>Email: ${email || 'N/A'}</p><p>Duration: ${months} days</p><p>Total: ₹${totalPrice}</p><p>Message: ${message || 'N/A'}</p></div>`);
  res.json({ success: true, whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Cool Cruze! I'm interested in renting ${product.name}. My name is ${name}.`)}` });
}));

app.get('/api/admin/check', (req, res) => {
  if (req.session && req.session.isAdmin) return res.json({ authenticated: true });
  res.status(401).json({ error: 'Not authenticated' });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

function apiAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

app.get('/api/admin/dashboard', apiAuth, asyncRoute(async (req, res) => {
  const [productCount, leadCount, todayLeadCount, recentLeads] = await Promise.all([
    db.getProductCount(),
    db.getLeadCount(),
    db.getTodayLeadCount(),
    db.getAllLeads()
  ]);
  const leads = Array.isArray(recentLeads) ? recentLeads : [];
  const sorted = [...leads].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.json({
    totalProducts: productCount.count,
    totalLeads: leadCount.count,
    newLeads: todayLeadCount.count,
    contactedLeads: leads.filter(l => l.status?.toLowerCase() === 'contacted').length,
    recentLeads: sorted.slice(0, 10)
  });
}));

app.get('/api/admin/products', apiAuth, asyncRoute(async (req, res) => {
  const products = await db.getAllProducts();
  res.json(products.map(normalizeApiProduct));
}));

app.post('/api/admin/products', apiAuth, prodUpload, asyncRoute(async (req, res) => {
  const uploadFile = getPrimaryUpload(req);
  const imageUrl = uploadFile ? await saveUpload(uploadFile) : '';
  const card_image = imageUrl;
  const detail_images = imageUrl ? [imageUrl] : [];
  const carousel_image = imageUrl;
  const price_per_day = parseFloat(req.body.price_per_day) || 0;
  const product = await db.addProduct({
    name: req.body.name || 'Unnamed',
    brand: req.body.brand || '',
    capacity: req.body.capacity || '1.5 Ton',
    type: req.body.type || 'Tower AC',
    monthly_price: price_per_day,
    card_image,
    detail_images,
    carousel_image,
    description: req.body.description || '',
    short_desc: req.body.short_desc || '',
    features: req.body.features || '',
    stock: parseInt(req.body.stock) || 1,
    tiers: [],
    use_flat_pricing: false,
    flat_days: 0,
    flat_price: 0,
    extra_day_rate: 0
  });
  res.status(201).json({ success: true, product: normalizeApiProduct(product) });
}));

app.put('/api/admin/products/:id', apiAuth, prodUpload, asyncRoute(async (req, res) => {
  const existing = await db.getProduct(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const uploadFile = getPrimaryUpload(req);
  const imageUrl = uploadFile ? await saveUpload(uploadFile) : '';
  const card_image = imageUrl || existing.card_image || existing.carousel_image || (existing.detail_images && existing.detail_images[0]) || '';
  const detail_images = imageUrl ? [imageUrl] : (existing.detail_images || []);
  const carousel_image = imageUrl || existing.carousel_image || existing.card_image || (existing.detail_images && existing.detail_images[0]) || '';
  const price_per_day = parseFloat(req.body.price_per_day) || parseFloat(existing.monthly_price) || 0;
  const updated = await db.updateProduct(req.params.id, {
    name: req.body.name || existing.name,
    brand: req.body.brand || existing.brand || '',
    capacity: req.body.capacity || existing.capacity || '1.5 Ton',
    type: req.body.type || existing.type || 'Tower AC',
    monthly_price: price_per_day,
    card_image,
    detail_images,
    carousel_image,
    description: req.body.description || existing.description || '',
    short_desc: req.body.short_desc || existing.short_desc || '',
    features: req.body.features || existing.features || '',
    stock: parseInt(req.body.stock) || existing.stock || 1,
    tiers: existing.tiers || [],
    use_flat_pricing: existing.use_flat_pricing || false,
    flat_days: existing.flat_days || 0,
    flat_price: existing.flat_price || 0,
    extra_day_rate: existing.extra_day_rate || 0
  });
  res.json({ success: true, product: normalizeApiProduct(updated) });
}));

app.delete('/api/admin/products/:id', apiAuth, asyncRoute(async (req, res) => {
  await db.deleteProduct(req.params.id);
  res.json({ success: true });
}));

app.get('/api/admin/leads', apiAuth, asyncRoute(async (req, res) => {
  const leads = await db.getAllLeads();
  res.json(leads);
}));

app.put('/api/admin/leads/:id/status', apiAuth, asyncRoute(async (req, res) => {
  await db.updateLeadStatus(req.params.id, req.body.status);
  res.json({ success: true });
}));

app.delete('/api/admin/leads/:id', apiAuth, asyncRoute(async (req, res) => {
  await db.deleteLead(req.params.id);
  res.json({ success: true });
}));

app.get('/api/admin/export', apiAuth, asyncRoute(async (req, res) => {
  const products = await db.getAllProducts();
  const leads = await db.getAllLeads();
  const images = {};
  for (const p of products) {
    const urls = [p.card_image, p.carousel_image, ...(p.detail_images || []), ...(p.images || [])].filter(Boolean);
    for (const url of urls) {
      if (url.startsWith('/uploads/') && !images[url]) {
        const filePath = path.join(__dirname, 'public', url);
        try { images[url] = fs.readFileSync(filePath).toString('base64'); } catch(e) {}
      }
    }
  }
  res.json({ products, leads, _images: images });
}));

const apiMulterImport = multer({ dest: path.join(__dirname, 'data', 'import') });
app.post('/api/admin/import', apiAuth, apiMulterImport.single('backup'), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const src = req.file.path;
  try {
    const data = JSON.parse(fs.readFileSync(src, 'utf-8'));
    if (data._images) {
      for (const [url, b64] of Object.entries(data._images)) {
        if (url.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, 'public', url);
          try { fs.mkdirSync(path.dirname(filePath), { recursive: true }); } catch(e) {}
          fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
        }
      }
    }
    if (data.products) {
      if (isPG) {
        for (const p of data.products) {
          const { _images, ...clean } = p;
          const existing = await db.getProduct(clean.id);
          if (existing) await db.updateProduct(clean.id, clean);
          else await db.addProduct(clean);
        }
      } else {
        const { _images, ...rest } = data;
        fs.writeFileSync(db.getDataFile(), JSON.stringify(rest, null, 2));
      }
    }
    try { fs.unlinkSync(src); } catch(e) {}
    res.json({ success: true, message: 'Import successful' });
  } catch (e) {
    try { fs.unlinkSync(src); } catch(e) {}
    res.status(400).json({ error: 'Invalid backup file: ' + e.message });
  }
}));

// Serve React build in production
const clientIndex = path.join(__dirname, 'client', 'dist', 'index.html');
if (fs.existsSync(clientIndex)) {
  app.use(express.static(path.join(__dirname, 'client', 'dist')));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/admin/') || req.path.startsWith('/uploads/')) return next();
    if (req.path === '/' || req.path === '/products' || req.path === '/about' || req.path === '/contact' || req.path.startsWith('/product/') || req.path.startsWith('/privacy') || req.path.startsWith('/terms')) return next();
    res.sendFile(clientIndex);
  });
}

const emailOk = !!(MJ_APIKEY && MJ_APISECRET && NOTIFY_EMAIL);

app.get('/offline', (req, res) => {
  res.render('offline', { title: 'Offline' });
});

app.get('/test-email', async (req, res) => {
  if (!MJ_APIKEY || !MJ_APISECRET) return res.send('MJ_APIKEY/MJ_APISECRET not set');
  if (!NOTIFY_EMAIL) return res.send('NOTIFY_EMAIL not set');
  try {
    await sendEmail('Test from Cool Cruze', '<p>Test email sent successfully!</p>');
    res.send('Test email sent to ' + NOTIFY_EMAIL);
  } catch (e) {
    res.send('Failed: ' + e.message);
  }
});

app.get('/admin/export', requireAuth, asyncRoute(async (req, res) => {
  const products = await db.getAllProducts();
  const leads = await db.getAllLeads();
  const images = {};
  // Collect local image files and embed them as base64
  for (const p of products) {
    const urls = [p.card_image, p.carousel_image, ...(p.detail_images || []), ...(p.images || [])].filter(Boolean);
    for (const url of urls) {
      if (url.startsWith('/uploads/') && !images[url]) {
        const filePath = path.join(__dirname, 'public', url);
        try {
          const buf = fs.readFileSync(filePath);
          images[url] = buf.toString('base64');
        } catch(e) {}
      }
    }
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="cool-cruze-backup.json"');
  res.json({ products, leads, _images: images });
}));

const multerImport = multer({ dest: path.join(__dirname, 'data', 'import') });
app.post('/admin/import', requireAuth, multerImport.single('backup'), asyncRoute(async (req, res) => {
  if (!req.file) return res.redirect('/admin?import=no-file');
  const src = req.file.path;
  try {
    const data = JSON.parse(fs.readFileSync(src, 'utf-8'));
    // Restore embedded images
    if (data._images) {
      for (const [url, b64] of Object.entries(data._images)) {
        if (url.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, 'public', url);
          try { fs.mkdirSync(path.dirname(filePath), { recursive: true }); } catch(e) {}
          fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
        }
      }
    }
    if (data.products) {
      if (isPG) {
        for (const p of data.products) {
          // Remove _images key if present on product
          const { _images, ...clean } = p;
          const existing = await db.getProduct(clean.id);
          if (existing) {
            await db.updateProduct(clean.id, clean);
          } else {
            await db.addProduct(clean);
          }
        }
      } else {
        const { _images, ...rest } = data;
        fs.writeFileSync(db.getDataFile(), JSON.stringify(rest, null, 2));
      }
    }
    try { fs.unlinkSync(src); } catch(e) {}
    res.redirect('/admin?import=ok');
  } catch (e) {
    try { fs.unlinkSync(src); } catch(e) {}
    res.redirect('/admin?import=error');
  }
}));

app.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact Us',
    metaDescription: 'Get in touch with Cool Cruze. Call, WhatsApp, or email us for AC rental inquiries. We respond within minutes.',
  });
});

app.post('/contact', asyncRoute(async (req, res) => {
  const { name, phone, email, message } = req.body;
  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Please fill all required fields' });
  }
  sendEmail(`Contact Form - ${name}`, `<div><h2>Contact Form Submission</h2><p>Name: ${name}</p><p>Phone: ${phone}</p><p>Email: ${email || 'N/A'}</p><p>Message: ${message}</p></div>`);
  res.json({ success: true });
}));

app.get('/sitemap.xml', asyncRoute(async (req, res) => {
  const products = await db.getAllProducts();
  const today = new Date().toISOString().split('T')[0];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  const pages = [
    { loc: '/', priority: '1.0' },
    { loc: '/products', priority: '0.9' },
    { loc: '/about', priority: '0.7' },
    { loc: '/contact', priority: '0.6' }
  ];
  pages.forEach(p => {
    xml += `  <url>\n    <loc>${BASE_URL}${p.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
  });
  products.forEach(p => {
    xml += `  <url>\n    <loc>${BASE_URL}/product/${p.id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });
  xml += '</urlset>';
  res.set('Content-Type', 'application/xml');
  res.send(xml);
}));

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /test-email\nDisallow: /offline\n\nSitemap: https://coolcruze.in/sitemap.xml');
});

app.get('/privacy-policy', (req, res) => {
  res.render('privacy-policy', { title: 'Privacy Policy' });
});

app.get('/terms-of-service', (req, res) => {
  res.render('terms-of-service', { title: 'Terms of Service' });
});

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

app.use((err, req, res, next) => {
  console.error('ERROR:', err.message, err.stack);
  res.status(500).send('Internal Server Error: ' + err.message);
});

app.listen(PORT, () => {
  console.log('Cool Cruze running at http://localhost:' + PORT);
});