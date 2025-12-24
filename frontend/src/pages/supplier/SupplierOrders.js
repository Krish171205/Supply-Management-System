import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../../services/api';
import './Pages.css';
import { formatNumber, formatDate } from '../../utils/format';

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
      const allOrders = res.data.orders || [];

      setPendingOrders(allOrders.filter(o => o.status === 'order_placed'));
      setShippedOrders(allOrders.filter(o => o.status === 'order_shipped'));
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

  const filterOrders = (orders, searchTerm) => {
    const lowerTerm = searchTerm.toLowerCase();
    return orders.filter(o => {
      const adminMatch = (o.admin?.name || '').toLowerCase().includes(lowerTerm);
      const idMatch = o.id.toString().includes(lowerTerm);
      const itemMatch = o.OrderItems?.some(item =>
        item.ingredient_name.toLowerCase().includes(lowerTerm) ||
        item.brand.toLowerCase().includes(lowerTerm)
      );
      return adminMatch || idMatch || itemMatch;
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Orders</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="loading">Loading...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <OrderTable
          title="Pending Orders"
          orders={filterOrders(pendingOrders, searchPending)}
          searchTerm={searchPending}
          onSearch={(e) => setSearchPending(e.target.value)}
          onAction={handleMarkShipped}
          actionLabel="Mark Shipped"
          showAction={true}
        />
        <OrderTable
          title="Shipped"
          orders={filterOrders(shippedOrders, searchShipped)}
          searchTerm={searchShipped}
          onSearch={(e) => setSearchShipped(e.target.value)}
          showAction={false}
        />
      </div>
    </div>
  );
}

const OrderTable = ({ title, orders, searchTerm, onSearch, onAction, actionLabel, showAction }) => (
  <div>
    <h2>{title}</h2>
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
            <th>Order ID</th>
            <th>Date</th>
            <th>Ingredients</th>
            <th>Quantity</th>
            <th>Total</th>
            {showAction && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map(order => {
              const totalAmount = order.OrderItems?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
              return (
                <React.Fragment key={order.id}>
                  {order.OrderItems?.map((item, idx) => {
                    const isLastItem = idx === (order.OrderItems.length - 1);
                    return (
                      <tr key={item.id}>
                        {idx === 0 && (
                          <td rowSpan={order.OrderItems.length} style={{ verticalAlign: 'middle' }}>
                            #{order.id}
                          </td>
                        )}
                        {idx === 0 && (
                          <td rowSpan={order.OrderItems.length} style={{ verticalAlign: 'middle' }}>
                            {formatDate(order.placed_at)}
                          </td>
                        )}
                        <td style={{ borderBottom: isLastItem ? undefined : 'none' }}>
                          <div style={{ fontSize: '0.9em' }}>
                            <div style={{ marginBottom: '0px' }}>{item.ingredient_name}</div>
                            {item.brand && (
                              <div style={{ fontSize: '0.8em', color: '#666', marginTop: '0px' }}>
                                {item.brand}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ borderBottom: isLastItem ? undefined : 'none' }}>
                          <div style={{ fontSize: '0.9em' }}>
                            {item.quantity} {item.unit === 'unit' ? 'units' : item.unit}
                          </div>
                        </td>
                        {idx === 0 && (
                          <td rowSpan={order.OrderItems.length} style={{ verticalAlign: 'middle' }}>
                            {formatNumber(totalAmount)}
                          </td>
                        )}
                        {showAction && idx === 0 && (
                          <td rowSpan={order.OrderItems.length} style={{ verticalAlign: 'middle' }}>
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => onAction(order.id)}
                            >
                              {actionLabel}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })
          ) : (
            <tr><td colSpan={showAction ? 6 : 5} className="text-center">No orders found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default SupplierOrders;
