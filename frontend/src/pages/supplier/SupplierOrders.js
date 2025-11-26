import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../../services/api';
import './Pages.css';
import { formatNumber } from '../../utils/format';

function SupplierOrders() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [shippedOrders, setShippedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPending, setSearchPending] = useState('');
  const [searchShipped, setSearchShipped] = useState('');

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getSupplierAll('', 1, 1000);
      const allOrders = res.data.data || [];
      const pending = allOrders.filter(o => o.status === 'order_placed');
      const shipped = allOrders.filter(o => o.status === 'order_shipped');
      setPendingOrders(pending);
      setShippedOrders(shipped);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkShipped = async (orderId) => {
    try {
      await ordersAPI.update(orderId, 'order_shipped');
      await fetchAllOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating order status');
    }
  };

  const formatOrder = (order) => ({
    id: order.id,
    ingredientName: order.Ingredient?.name || 'N/A',
    amount: order.amt,
    price: order.price,
    status: order.status,
    createdAt: new Date(order.created_at).toLocaleDateString(),
    order: order
  });

  const filterOrders = (orders, searchTerm) => {
    return orders
      .map(formatOrder)
      .filter(o => `${o.ingredientName}`.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.order.created_at) - new Date(a.order.created_at));
  };

  const filteredPending = filterOrders(pendingOrders, searchPending);
  const filteredShipped = filterOrders(shippedOrders, searchShipped);

  const OrderTable = ({ title, orders, searchTerm, onSearch, onAction, showAction }) => (
    <div>
      <h2>{title.replace(/\s*\([^)]*\)/, '')}</h2>
      <input
        type="text"
        className="search-compact"
        placeholder="Search..."
        value={searchTerm}
        onChange={onSearch}
        style={{ marginBottom: '20px' }}
      />
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Amount</th>
              <th>Price</th>
              <th>Status</th>
              <th>Date</th>
              {showAction && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map(o => (
                <tr key={o.id}>
                  <td>{o.ingredientName}</td>
                  <td>{formatNumber(o.amount)}</td>
                  <td>{formatNumber(o.price)}</td>
                  <td>{o.status}</td>
                  <td>{o.createdAt}</td>
                  {showAction && (
                    <td>
                      <button
                        className="btn btn-small btn-primary"
                        style={{ textTransform: 'none' }}
                        onClick={() => onAction(o.id)}
                      >
                        Mark Shipped
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={showAction ? 6 : 5} className="text-center">
                  No orders
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Orders</h1>
        {/* Refresh button removed as per request */}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="loading">Loading...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <OrderTable
          title="Pending (Default)"
          orders={filteredPending}
          searchTerm={searchPending}
          onSearch={(e) => setSearchPending(e.target.value)}
          onAction={handleMarkShipped}
          showAction={true}
        />
        <OrderTable
          title="Shipped"
          orders={filteredShipped}
          searchTerm={searchShipped}
          onSearch={(e) => setSearchShipped(e.target.value)}
          showAction={false}
        />
      </div>
    </div>
  );
}

export default SupplierOrders;
