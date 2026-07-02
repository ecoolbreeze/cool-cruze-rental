import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import RentModal from './components/RentModal';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminLogin from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProducts from './pages/Admin/Products';
import AdminLeads from './pages/Admin/Leads';
import NotFound from './pages/NotFound';
import { useState } from 'react';

export default function App() {
  const [rentData, setRentData] = useState(null);

  const openRentModal = (product) => setRentData(product);
  const closeRentModal = () => setRentData(null);

  return (
    <AuthProvider>
      <Header onRentClick={() => document.querySelector('.hero-cta')?.scrollIntoView()} />
      <main>
        <Routes>
          <Route path="/" element={<Home onRent={openRentModal} />} />
          <Route path="/products" element={<Products onRent={openRentModal} />} />
          <Route path="/product/:id" element={<ProductDetail onRent={openRentModal} />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/leads" element={<AdminLeads />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      {rentData && <RentModal product={rentData} onClose={closeRentModal} />}
    </AuthProvider>
  );
}