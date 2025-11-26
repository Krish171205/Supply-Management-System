import { Routes, Route, useNavigate } from 'react-router-dom';
import Vendors from './Vendors';
import Inquiries from './AdminInquiries';
import Orders from './AdminOrders';
import Profile from './Profile';
import './Dashboard.css';

import TopNavigation from '../../components/Layout/TopNavigation';
import Footer from '../../components/Layout/Footer';

function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const adminLinks = [
    { path: '/admin/vendors', label: 'Vendors' },
    { path: '/admin/inquiries', label: 'Inquiries' },
    { path: '/admin/orders', label: 'Orders' },
    { path: '/admin/profile', label: 'Profile' },
  ];

  return (
    <div className="dashboard">
      <TopNavigation links={adminLinks} user={user} onLogout={handleLogout} />

      <main className="dashboard-content">
        <div className="content-container">
          <Routes>
            <Route path="/" element={<Vendors />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/inquiries" element={<Inquiries />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile user={user} />} />
          </Routes>
        </div>
      </main>
      <Footer userRole="admin" />
    </div>
  );
}

export default AdminDashboard;
