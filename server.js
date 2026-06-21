const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const db = require('./db');

try {
  if (db.getAllProducts().length === 0) {
    const seed = require('./seed');
    seed.run();
  }
} catch (e) {
  console.log('Seed error:', e.message);
}

const app = express();

const PORT = process.env.PORT || 3000;
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '917977471369';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'info@coolcruze.in';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || '';

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

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.whatsappNumber = WHATSAPP_NUMBER;
  next();
});

app.get('/', (req, res) => {
  const products = db.getAllProducts();
  const featured = products.slice(0, 4);
  res.render('index', { title: 'Home', featured, products });
});

app.get('/products', (req, res) => {
  const products = db.getAllProducts();
  res.render('products', { title: 'Products', products });
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'About Us' });
});

app.get('/product/:id', (req, res) => {
  const product = db.getProduct(req.params.id);
  if (!product) return res.redirect('/products');
  res.render('product-detail', { title: product.name, product });
});

app.get('/rent/:id', (req, res) => {
  res.redirect('/product/' + req.params.id);
});

app.post('/rent/:id', (req, res) => {
  try {
    const product = db.getProduct(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { customer_name, phone, address, message } = req.body;
    if (!customer_name || !phone || !address) {
      return res.status(400).json({ error: 'Please fill all required fields' });
    }

    db.addLead({
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

    return res.json({
      success: true,
      whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Cool Cruze! I'm interested in renting ${product.name}. My name is ${customer_name}.`)}`
    });
  } catch (err) {
    console.error('Rent POST error:', err.message, err.stack);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

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

app.get('/admin', requireAuth, (req, res) => {
  const productCount = db.getProductCount().count;
  const leadCount = db.getLeadCount().count;
  const todayLeadCount = db.getTodayLeadCount().count;
  const recentLeads = db.getAllLeads().slice(0, 5);
  res.render('admin/dashboard', { title: 'Dashboard', productCount, leadCount, todayLeadCount, recentLeads });
});

app.get('/admin/products', requireAuth, (req, res) => {
  const products = db.getAllProducts();
  res.render('admin/products', { title: 'Manage Products', products });
});

app.post('/admin/products', requireAuth, upload.array('images', 5), (req, res) => {
  const { name, brand, capacity, type, monthly_price, description, features, stock } = req.body;
  const images = req.files ? req.files.map(f => '/uploads/' + f.filename) : [];
  db.addProduct({ name, brand, capacity, type, monthly_price: parseFloat(monthly_price), images, description, features, stock: parseInt(stock) || 1 });
  res.redirect('/admin/products');
});

app.post('/admin/products/edit/:id', requireAuth, upload.array('images', 5), (req, res) => {
  const { name, brand, capacity, type, monthly_price, description, features, stock } = req.body;
  const existing = db.getProduct(req.params.id);
  const newImgs = req.files ? req.files.map(f => '/uploads/' + f.filename) : [];
  const images = newImgs.length ? newImgs : (existing.images && existing.images.length ? existing.images : (existing.image ? [existing.image] : []));
  db.updateProduct(req.params.id, { name, brand, capacity, type, monthly_price: parseFloat(monthly_price), images, description, features, stock: parseInt(stock) || 1 });
  res.redirect('/admin/products');
});

app.post('/admin/products/delete/:id', requireAuth, (req, res) => {
  db.deleteProduct(req.params.id);
  res.redirect('/admin/products');
});

app.get('/admin/leads', requireAuth, (req, res) => {
  const leads = db.getAllLeads();
  res.render('admin/leads', { title: 'Leads', leads });
});

app.post('/admin/leads/status/:id', requireAuth, (req, res) => {
  db.updateLeadStatus(req.params.id, req.body.status);
  res.redirect('/admin/leads');
});

app.post('/admin/leads/delete/:id', requireAuth, (req, res) => {
  db.deleteLead(req.params.id);
  res.redirect('/admin/leads');
});

const emailOk = SENDGRID_API_KEY && NOTIFY_EMAIL;
console.log('SendGrid: ' + (emailOk ? 'READY' : 'NOT configured') + ' | From: ' + SENDER_EMAIL + ' | To: ' + (NOTIFY_EMAIL || '(not set)'));

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

app.listen(PORT, () => {
  console.log('Cool Cruze running at http://localhost:' + PORT);
});
