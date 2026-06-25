const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '917977471369';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'info@coolcruze.in';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || '';
const DATABASE_URL = process.env.DATABASE_URL;
const isPG = !!DATABASE_URL;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'cool-cruze-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

if (SENDGRID_API_KEY) sgMail.setApiKey(SENDGRID_API_KEY);

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/admin/login');
}

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.whatsappNumber = WHATSAPP_NUMBER;
  next();
});

app.get('/', asyncRoute(async (req, res) => {
  const products = await db.getAllProducts();
  const featured = [...products].reverse().slice(0, 4);
  res.render('index', { title: 'Home', featured, products });
}));

app.get('/products', asyncRoute(async (req, res) => {
  const products = await db.getAllProducts();
  res.render('products', { title: 'Products', products });
}));

app.get('/about', (req, res) => {
  res.render('about', { title: 'About Us' });
});

app.get('/product/:id', asyncRoute(async (req, res) => {
  const product = await db.getProduct(req.params.id);
  if (!product) return res.redirect('/products');
  res.render('product-detail', { title: product.name, product });
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

  if (SENDGRID_API_KEY && NOTIFY_EMAIL) {
    sgMail.send({
      from: SENDER_EMAIL,
      to: NOTIFY_EMAIL,
      subject: `New Rental Lead - ${product.name}`,
      html: `<div><h2>New Rental Inquiry - Cool Cruze</h2><p>Product: ${product.name}</p><p>Name: ${customer_name}</p><p>Phone: ${phone}</p><p>Address: ${address}</p><p>Message: ${message || 'N/A'}</p></div>`
    }).then(() => console.log('Email sent via SendGrid')).catch(e => console.log('Email failed:', e.message));
  }

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

const prodUpload = upload.fields([
  { name: 'card_image', maxCount: 1 },
  { name: 'featured_image', maxCount: 1 },
  { name: 'detail_images', maxCount: 5 }
]);

app.post('/admin/products', requireAuth, prodUpload, asyncRoute(async (req, res) => {
  const { name, brand, capacity, type, monthly_price, description, features, stock, use_flat_pricing, flat_days, flat_price, extra_day_rate } = req.body;
  const getFile = (field) => req.files && req.files[field] && req.files[field].length ? '/uploads/' + req.files[field][0].filename : '';
  const getFiles = (field) => req.files && req.files[field] ? req.files[field].map(f => '/uploads/' + f.filename) : [];
  const card_image = getFile('card_image');
  const featured_image = getFile('featured_image');
  const detail_images = getFiles('detail_images');
  const tiers = parseTiers(req.body);
  await db.addProduct({ name, brand, capacity, type, monthly_price: parseFloat(monthly_price), card_image, featured_image, detail_images, description, features, stock: parseInt(stock) || 1, tiers, use_flat_pricing: !!use_flat_pricing, flat_days: parseInt(flat_days) || 0, flat_price: parseFloat(flat_price) || 0, extra_day_rate: parseFloat(extra_day_rate) || 0 });
  res.redirect('/admin/products');
}));

app.post('/admin/products/edit/:id', requireAuth, prodUpload, asyncRoute(async (req, res) => {
  const { name, brand, capacity, type, monthly_price, description, features, stock, use_flat_pricing, flat_days, flat_price, extra_day_rate } = req.body;
  const existing = await db.getProduct(req.params.id);
  if (!existing) return res.redirect('/admin/products');
  const getFile = (field) => req.files && req.files[field] && req.files[field].length ? '/uploads/' + req.files[field][0].filename : '';
  const getFiles = (field) => req.files && req.files[field] ? req.files[field].map(f => '/uploads/' + f.filename) : [];
  const card_image = getFile('card_image') || existing.card_image || '';
  const featured_image = getFile('featured_image') || existing.featured_image || '';
  const detail_images = getFiles('detail_images').length ? getFiles('detail_images') : (existing.detail_images && existing.detail_images.length ? existing.detail_images : []);
  const tiers = parseTiers(req.body);
  await db.updateProduct(req.params.id, { name, brand, capacity, type, monthly_price: parseFloat(monthly_price), card_image, featured_image, detail_images, description, features, stock: parseInt(stock) || 1, tiers, use_flat_pricing: !!use_flat_pricing, flat_days: parseInt(flat_days) || 0, flat_price: parseFloat(flat_price) || 0, extra_day_rate: parseFloat(extra_day_rate) || 0 });
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

const emailOk = SENDGRID_API_KEY && NOTIFY_EMAIL;
console.log('Database: ' + (isPG ? 'PostgreSQL' : 'JSON file') + ' | SendGrid: ' + (emailOk ? 'READY' : 'NOT configured') + ' | From: ' + SENDER_EMAIL + ' | To: ' + (NOTIFY_EMAIL || '(not set)'));

app.get('/offline', (req, res) => {
  res.render('offline', { title: 'Offline' });
});

app.get('/test-email', async (req, res) => {
  if (!SENDGRID_API_KEY) return res.send('SENDGRID_API_KEY not set');
  if (!NOTIFY_EMAIL) return res.send('NOTIFY_EMAIL not set');
  try {
    await sgMail.send({
      from: SENDER_EMAIL,
      to: NOTIFY_EMAIL,
      subject: 'Test from Cool Cruze',
      html: '<p>Test email sent successfully!</p>'
    });
    res.send('Test email sent to ' + NOTIFY_EMAIL);
  } catch (e) {
    res.send('Failed: ' + e.message);
  }
});

app.get('/admin/export', requireAuth, asyncRoute(async (req, res) => {
  const products = await db.getAllProducts();
  const leads = await db.getAllLeads();
  const data = JSON.stringify({ products, leads }, null, 2);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="cool-cruze-backup.json"');
  res.send(data);
}));

const multerImport = multer({ dest: path.join(__dirname, 'data', 'import') });
app.post('/admin/import', requireAuth, multerImport.single('backup'), asyncRoute(async (req, res) => {
  if (!req.file) return res.redirect('/admin?import=no-file');
  const src = req.file.path;
  try {
    const data = JSON.parse(fs.readFileSync(src, 'utf-8'));
    if (data.products) {
      if (isPG) {
        for (const p of data.products) {
          const existing = await db.getProduct(p.id);
          if (existing) {
            await db.updateProduct(p.id, p);
          } else {
            await db.addProduct(p);
          }
        }
      } else {
        fs.writeFileSync(db.getDataFile(), JSON.stringify(data, null, 2));
      }
    }
    try { fs.unlinkSync(src); } catch(e) {}
    res.redirect('/admin?import=ok');
  } catch (e) {
    try { fs.unlinkSync(src); } catch(e) {}
    res.redirect('/admin?import=error');
  }
}));

app.use((err, req, res, next) => {
  console.error('ERROR:', err.message, err.stack);
  res.status(500).send('Internal Server Error: ' + err.message);
});

app.listen(PORT, () => {
  console.log('Cool Cruze running at http://localhost:' + PORT);
});