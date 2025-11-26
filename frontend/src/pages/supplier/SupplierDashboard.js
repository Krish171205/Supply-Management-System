import { Routes, Route, useNavigate } from 'react-router-dom';
import SupplierInquiries from './SupplierInquiries';
import SupplierOrders from './SupplierOrders';
import SupplierProfile from './SupplierProfile';
import '../admin/Dashboard.css';

import TopNavigation from '../../components/Layout/TopNavigation';
import Footer from '../../components/Layout/Footer';

function SupplierDashboard({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const supplierLinks = [
    { path: '/supplier/inquiries', label: 'Inquiries' },
    { path: '/supplier/orders', label: 'Orders' },
    { path: '/supplier/profile', label: 'Profile' },
  ];

  return (
    <div className="dashboard">
      <TopNavigation links={supplierLinks} user={user} onLogout={handleLogout} />

      <main className="dashboard-content">
        <div className="content-container">
          <Routes>
            <Route path="/" element={<SupplierInquiries />} />
            <Route path="/inquiries" element={<SupplierInquiries />} />
            <Route path="/orders" element={<SupplierOrders />} />
            <Route path="/profile" element={<SupplierProfile user={user} />} />
          </Routes>
        </div>
      </main>
      <Footer userRole="supplier" />
    </div>
  );
}

export default SupplierDashboard;
