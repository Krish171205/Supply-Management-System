import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../../services/api';
import './Pages.css';
import { formatNumber } from '../../utils/format';

function AdminOrders() {
  const [placedOrders, setPlacedOrders] = useState([]);
  const [shippedOrders, setShippedOrders] = useState([]);
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPlaced, setSearchPlaced] = useState('');
  const [searchShipped, setSearchShipped] = useState('');
  const [searchReceived, setSearchReceived] = useState('');
  const [showMorePlaced, setShowMorePlaced] = useState(false);
  const [showMoreShipped, setShowMoreShipped] = useState(false);
  const [showMoreReceived, setShowMoreReceived] = useState(false);

  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      // Fetch all quotes/orders
      const res = await ordersAPI.getAdminAll('', 1, 1000);
      const allOrders = res.data.data || [];

      // Filter by status
      const placed = allOrders.filter(o => o.status === 'order_placed');
      const shipped = allOrders.filter(o => o.status === 'order_shipped');
      const received = allOrders.filter(o => o.status === 'order_received');

      setPlacedOrders(placed);
      setShippedOrders(shipped);
      setReceivedOrders(received);
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

  const formatOrder = (order) => (
    {
      id: order.id,
      ingredientName: order.Ingredient?.name || 'N/A',
      supplierName: order.supplier?.name || 'N/A',
      price: order.price,
      amount: order.amt,
      total: order.price && order.amt ? formatNumber(order.price * order.amt) : 'N/A',
      status: order.status,
      createdAt: new Date(order.created_at).toLocaleDateString(),
      order: order
    }
  );

  const filterOrders = (orders, searchTerm) => {
    return orders
      .map(formatOrder)
      .filter(o =>
        `${o.ingredientName} ${o.supplierName}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.order.created_at) - new Date(a.order.created_at));
  };

  const filteredPlaced = filterOrders(placedOrders, searchPlaced);
  const filteredShipped = filterOrders(shippedOrders, searchShipped);
  const filteredReceived = filterOrders(receivedOrders, searchReceived);

  const OrderTable = ({ title, orders, searchTerm, onSearch, onStatusChange, canChangeStatus, showMore, onToggleShowMore }) => {
    const displayedOrders = showMore ? orders : orders.slice(0, ITEMS_PER_PAGE);

    return (
      <div style={{ marginBottom: '30px' }}>
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
                <th>Supplier</th>
                <th>Price</th>
                <th>Amount</th>
                <th>Total</th>
                <th>Date</th>
                {canChangeStatus && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {displayedOrders.length > 0 ? (
                displayedOrders.map(o => (
                  <tr key={o.id}>
                    <td>{o.ingredientName}</td>
                    <td>{o.supplierName}</td>
                    <td>{formatNumber(o.price)}</td>
                    <td>{formatNumber(o.amount)}</td>
                    <td>{o.total}</td>
                    <td>{o.createdAt}</td>
                    {canChangeStatus && (
                      <td>
                        <button
                          className="btn btn-small btn-primary"
                          style={{ textTransform: 'none' }}
                          onClick={() => onStatusChange(o.id, 'order_received')}
                        >
                          Mark Received
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canChangeStatus ? 7 : 6} className="text-center">
                    No orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {orders.length > ITEMS_PER_PAGE && (
          <button
            className="btn btn-secondary"
            onClick={onToggleShowMore}
            style={{ marginTop: '10px' }}
          >
            {showMore ? '▲ Show Less' : '▼ Show More'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Orders Management</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="loading">Loading...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <OrderTable
          title="Placed (Waiting for Shipment)"
          orders={filteredPlaced}
          searchTerm={searchPlaced}
          onSearch={(e) => setSearchPlaced(e.target.value)}
          canChangeStatus={false}
          showMore={showMorePlaced}
          onToggleShowMore={() => setShowMorePlaced(!showMorePlaced)}
        />
        <OrderTable
          title="Shipped (In Transit)"
          orders={filteredShipped}
          searchTerm={searchShipped}
          onSearch={(e) => setSearchShipped(e.target.value)}
          onStatusChange={handleStatusChange}
          canChangeStatus={true}
          showMore={showMoreShipped}
          onToggleShowMore={() => setShowMoreShipped(!showMoreShipped)}
        />
        <OrderTable
          title="Received (Completed)"
          orders={filteredReceived}
          searchTerm={searchReceived}
          onSearch={(e) => setSearchReceived(e.target.value)}
          canChangeStatus={false}
          showMore={showMoreReceived}
          onToggleShowMore={() => setShowMoreReceived(!showMoreReceived)}
        />
      </div>
    </div>
  );
}

export default AdminOrders;
