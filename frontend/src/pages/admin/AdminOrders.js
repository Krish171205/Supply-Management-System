import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../../services/api';
import './Pages.css';
import { formatNumber, formatDate } from '../../utils/format';

function AdminOrders() {
  const [placedOrders, setPlacedOrders] = useState([]);
  const [shippedOrders, setShippedOrders] = useState([]);
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPlaced, setSearchPlaced] = useState('');
  const [searchShipped, setSearchShipped] = useState('');
  const [searchReceived, setSearchReceived] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchAllOrders();
  }, [startDate, endDate]);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAdminAll('', 1, 1000, startDate, endDate);
      const allOrders = res.data.orders || [];

      setPlacedOrders(allOrders.filter(o => o.status === 'order_placed'));
      setShippedOrders(allOrders.filter(o => o.status === 'order_shipped'));
      setReceivedOrders(allOrders.filter(o => o.status === 'order_received'));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.update(orderId, newStatus);
      await fetchAllOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating order status');
    }
  };

  const filterOrders = (orders, searchTerm) => {
    const lowerTerm = searchTerm.toLowerCase();
    return orders.filter(o => {
      const supplierMatch = o.Supplier?.User?.name.toLowerCase().includes(lowerTerm);
      const itemMatch = o.OrderItems?.some(item =>
        item.ingredient_name.toLowerCase().includes(lowerTerm) ||
        item.brand.toLowerCase().includes(lowerTerm)
      );
      return supplierMatch || itemMatch;
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Orders Management</h1>
      </div>

      <div className="form-card" style={{ padding: '15px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={() => { setStartDate(''); setEndDate(''); }} style={{ height: '42px' }}>
            Clear
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="loading">Loading...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <OrderTable
          title="Placed Orders"
          orders={filterOrders(placedOrders, searchPlaced)}
          searchTerm={searchPlaced}
          onSearch={(e) => setSearchPlaced(e.target.value)}
          canChangeStatus={false}
        />
        <OrderTable
          title="Shipped Orders"
          orders={filterOrders(shippedOrders, searchShipped)}
          searchTerm={searchShipped}
          onSearch={(e) => setSearchShipped(e.target.value)}
          onStatusChange={handleStatusChange}
          canChangeStatus={true}
          statusActionLabel="Mark Received"
          statusActionValue="order_received"
        />
        <OrderTable
          title="Received Orders"
          orders={filterOrders(receivedOrders, searchReceived)}
          searchTerm={searchReceived}
          onSearch={(e) => setSearchReceived(e.target.value)}
          canChangeStatus={false}
        />
      </div>
    </div>
  );
}

const OrderTable = ({ title, orders, searchTerm, onSearch, onStatusChange, canChangeStatus, statusActionLabel, statusActionValue }) => (
  <div>
    <h2>{title}</h2>
    <input
      type="text"
      className="search-compact"
      placeholder="Search Supplier..."
      value={searchTerm}
      onChange={onSearch}
      style={{ marginBottom: '20px' }}
    />
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Supplier</th>
            <th>Ingredients</th>
            <th>Quantity</th>
            <th>Total Cost</th>
            <th>Date</th>
            {canChangeStatus && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map(order => {
              const totalAmount = order.OrderItems?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
              return (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.Supplier?.User?.name}</td>
                  <td>
                    {order.OrderItems?.map(item => (
                      <div key={item.id} style={{ marginBottom: '8px' }}>
                        <div style={{ marginBottom: '0px' }}>{item.ingredient_name}</div>
                        {item.brand && (
                          <div style={{ fontSize: '0.8em', color: '#666', marginTop: '0px' }}>
                            {item.brand}
                          </div>
                        )}
                      </div>
                    ))}
                  </td>
                  <td>
                    {order.OrderItems?.map(item => (
                      <div key={item.id} style={{ marginBottom: '8px' }}>
                        {item.quantity} {item.unit === 'unit' ? 'units' : item.unit}
                        {/* Spacer to align with ingredient/brand block if needed, though simple list is usually fine */}
                        {item.brand && <div style={{ height: '1.2em' }}></div>}
                      </div>
                    ))}
                  </td>
                  <td>{formatNumber(totalAmount)}</td>
                  <td>{formatDate(order.placed_at)}</td>
                  {canChangeStatus && (
                    <td>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => onStatusChange(order.id, statusActionValue)}
                      >
                        {statusActionLabel}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })
          ) : (
            <tr><td colSpan={canChangeStatus ? 7 : 6} className="text-center">No orders found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminOrders;
