import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../../services/api';
import './Pages.css';
import { formatNumber } from '../../utils/format';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await ordersAPI.getAdminAll(statusFilter);
      setOrders(response.data.data || response.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await ordersAPI.update(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating quote');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Orders Management</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-bar">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
          }}
          style={{ maxWidth: '200px' }}
        >
          <option value="">All Statuses</option>
          <option value="quoted">Quoted</option>
          <option value="order_placed">Order Placed</option>
          <option value="order_in_process">In Process</option>
          <option value="order_shipped">Shipped</option>
          <option value="order_received">Received</option>
        </select>
      </div>

      {loading && <p className="loading">Loading...</p>}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Supplier</th>
              <th>Ingredient</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.supplier?.name || order.supplier?.email}</td>
                  <td>{order.Ingredient?.name}</td>
                  <td>${formatNumber(order.price)}</td>
                  <td><span className="badge">{order.status}</span></td>
                  <td>
                    {order.status === 'quoted' && (
                      <button
                        className="btn btn-small btn-primary"
                        onClick={() => handleStatusUpdate(order.id, 'order_placed')}
                      >
                        Accept
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">No quotes found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Orders;
