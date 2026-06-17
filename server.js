const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const db = require('./db');

// Auto-seed if database is empty (first deployment)
if (db.getAllProducts().length === 0) {
  const seed = require('./seed');
  seed.run();
}

const app = express();

// Config
const PORT = process.env.PORT || 3000;
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '917977471369';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'cool-cruze-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

// Nodemailer transporter
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
}

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/admin/login');
}

// Public variables
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.whatsappNumber = WHATSAPP_NUMBER;
  next();
});

// ========== PUBLIC ROUTES ==========

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

app.post('/rent/:id', async (req, res) => {
  const product = db.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { customer_name, phone, address, message } = req.body;

  if (!customer_name || !phone || !address) {
    return res.status(400).json({ error: 'Please fill all required fields' });
  }

  // Save lead
  db.addLead({
    product_id: product.id,
    product_name: product.name,
    customer_name,
    phone,
    address,
    message: message || ''
  });

  // Send email notification (non-blocking)
  const gmailUser = process.env.GMAIL_USER;
  if (gmailUser && gmailUser !== 'your-email@gmail.com' && process.env.GMAIL_PASS && process.env.GMAIL_PASS !== 'your-app-password') {
    try {
      const transporter = getTransporter();
      const mailOptions = {
        from: gmailUser,
        to: process.env.NOTIFY_EMAIL || gmailUser,
        subject: `New Rental Lead - ${product.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #1a56db;">New Rental Inquiry - Cool Cruze</h2>
            <table style="width:100%; border-collapse: collapse;">
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Product</strong></td><td style="padding:8px; border:1px solid #ddd;">${product.name}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Customer Name</strong></td><td style="padding:8px; border:1px solid #ddd;">${customer_name}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Phone</strong></td><td style="padding:8px; border:1px solid #ddd;">${phone}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Address</strong></td><td style="padding:8px; border:1px solid #ddd;">${address}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Message</strong></td><td style="padding:8px; border:1px solid #ddd;">${message || 'N/A'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Date</strong></td><td style="padding:8px; border:1px solid #ddd;">${new Date().toLocaleString()}</td></tr>
            </table>
          </div>
        `
      };
      await transporter.sendMail(mailOptions);
    } catch (e) {
      console.log('Email sending failed (check GMAIL_USER/PASS in .env):', e.message);
    }
  } else {
    console.log('Email not configured — skipping notification. Edit .env to enable.');
  }

  res.json({
    success: true,
    whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Cool Cruze! I'm interested in renting ${product.name}. My name is ${customer_name}.`)}`
  });
});

// ========== ADMIN ROUTES ==========

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
  res.render('admin/dashboard', {
    title: 'Dashboard',
    productCount,
    leadCount,
    todayLeadCount,
    recentLeads
  });
});

app.get('/admin/products', requireAuth, (req, res) => {
  const products = db.getAllProducts();
  res.render('admin/products', { title: 'Manage Products', products });
});

app.post('/admin/products', requireAuth, upload.single('image'), (req, res) => {
  const { name, brand, capacity, type, monthly_price, description, features, stock } = req.body;
  const image = req.file ? '/uploads/' + req.file.filename : '';
  db.addProduct({ name, brand, capacity, type, monthly_price: parseFloat(monthly_price), image, description, features, stock: parseInt(stock) || 1 });
  res.redirect('/admin/products');
});

app.post('/admin/products/edit/:id', requireAuth, upload.single('image'), (req, res) => {
  const { name, brand, capacity, type, monthly_price, description, features, stock } = req.body;
  const existing = db.getProduct(req.params.id);
  const image = req.file ? '/uploads/' + req.file.filename : (existing.image || '');
  db.updateProduct(req.params.id, { name, brand, capacity, type, monthly_price: parseFloat(monthly_price), image, description, features, stock: parseInt(stock) || 1 });
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

// Start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cool Cruze running at http://localhost:${PORT}`);
});
