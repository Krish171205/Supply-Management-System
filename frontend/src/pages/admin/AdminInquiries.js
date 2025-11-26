import React, { useState, useEffect } from 'react';
import { inquiriesAPI, ingredientsAPI, suppliersAPI, ordersAPI } from '../../services/api';
import './Pages.css';
import { formatNumber } from '../../utils/format';

function AdminInquiries() {
  const [sentInquiries, setSentInquiries] = useState([]);
  const [receivedInquiries, setReceivedInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchSent, setSearchSent] = useState('');
  const [searchReceived, setSearchReceived] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterMode, setFilterMode] = useState('ingredient'); // ingredient or supplier
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [ingredientOptions, setIngredientOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [notes, setNotes] = useState('');
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [orderAmount, setOrderAmount] = useState('');

  useEffect(() => {
    fetchAllInquiries();
    fetchOptions();
  }, []);

  const fetchAllInquiries = async () => {
    setLoading(true);
    try {
      const res = await inquiriesAPI.getAll(1, 1000);
      const allInquiries = res.data.data || [];

      // Fetch all quotes once
      const quotesRes = await ordersAPI.getAdminAll('', 1, 1000);
      const allQuotes = quotesRes.data.data || [];

      // Split into sent and received
      const sent = [];
      const received = [];

      for (const inq of allInquiries) {
        // Skip cancelled inquiries
        if (inq.status === 'cancelled') {
          continue;
        }

        // Check if this inquiry has a quote (response)
        const quoteForInquiry = allQuotes.find(q => q.inquiry_id === inq.id);

        if (quoteForInquiry) {
          // Only show in received if quote is in 'quoted' status (not yet ordered)
          // Once accepted, quote status becomes 'order_placed' and should not appear in received list
          if (quoteForInquiry.status === 'quoted') {
            received.push({ ...inq, quote: quoteForInquiry });
          }
          // Otherwise, quote has been accepted/ordered, so don't show in received
        } else {
          // No quote yet, show in sent
          sent.push(inq);
        }
      }

      setSentInquiries(sent);
      setReceivedInquiries(received);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching inquiries');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const ingRes = await ingredientsAPI.getAll('', 1, 1000);
      setIngredientOptions(ingRes.data.ingredients || []);

      const supRes = await suppliersAPI.getAll('', 1, 1000);
      setSupplierOptions(supRes.data.suppliers || []);
    } catch (err) {
      console.error('Error fetching options', err);
    }
  };

  const handleCreateInquiry = async (e) => {
    e.preventDefault();
    if (filterMode === 'ingredient' && !selectedIngredient) {
      setError('Please select an ingredient');
      return;
    }
    if (filterMode === 'supplier' && (!selectedSupplier || !selectedIngredient)) {
      setError('Please select both supplier and ingredient');
      return;
    }

    try {
      if (filterMode === 'ingredient') {
        // Get suppliers for this ingredient
        const ingRes = await ingredientsAPI.getSuppliers(selectedIngredient);
        const suppliers = ingRes.data.suppliers || [];
        if (suppliers.length === 0) {
          setError('No suppliers for this ingredient');
          return;
        }
        // Create inquiries for all suppliers
        for (const sup of suppliers) {
          await inquiriesAPI.create({
            ingredient_id: parseInt(selectedIngredient),
            supplier_user_id: sup.id,
            notes
          });
        }
      } else {
        // Create inquiry for specific supplier and ingredient
        await inquiriesAPI.create({
          ingredient_id: parseInt(selectedIngredient),
          supplier_user_id: parseInt(selectedSupplier),
          notes
        });
      }

      setSelectedIngredient('');
      setSelectedSupplier('');
      setNotes('');
      setShowForm(false);
      await fetchAllInquiries();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating inquiry');
    }
  };

  const handlePlaceOrder = async () => {
    if (!orderAmount || isNaN(orderAmount) || orderAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    try {
      await ordersAPI.accept(selectedQuote.id, parseFloat(orderAmount));
      setShowAmountModal(false);
      setOrderAmount('');
      setSelectedQuote(null);
      await fetchAllInquiries();
    } catch (err) {
      setError(err.response?.data?.message || 'Error placing order');
    }
  };

  const handleCancelInquiry = async (inquiryId) => {
    if (!window.confirm('Cancel this inquiry?')) return;
    try {
      await inquiriesAPI.updateStatus(inquiryId, 'cancelled');
      await fetchAllInquiries();
    } catch (err) {
      setError(err.response?.data?.message || 'Error canceling inquiry');
    }
  };

  const filteredSent = sentInquiries.filter(inq => {
    const text = `${inq.Ingredient?.name} ${inq.supplierUser?.name}`.toLowerCase();
    return text.includes(searchSent.toLowerCase());
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filteredReceived = receivedInquiries.filter(inq => {
    const text = `${inq.Ingredient?.name} ${inq.supplierUser?.name}`.toLowerCase();
    return text.includes(searchReceived.toLowerCase());
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Inquiries Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New Inquiry'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h3>Create Inquiry</h3>
          <form onSubmit={handleCreateInquiry}>
            <div className="form-group">
              <label>Select By</label>
              <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
                <option value="ingredient">Ingredient (will send to all suppliers)</option>
                <option value="supplier">Specific Supplier</option>
              </select>
            </div>

            <div className="form-group">
              <label>Ingredient</label>
              <select
                value={selectedIngredient}
                onChange={(e) => setSelectedIngredient(e.target.value)}
                required
              >
                <option value="">-- Select Ingredient --</option>
                {ingredientOptions.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name}</option>
                ))}
              </select>
            </div>

            {filterMode === 'supplier' && (
              <div className="form-group">
                <label>Supplier</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  required
                >
                  <option value="">-- Select Supplier --</option>
                  {supplierOptions.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Send Inquiry
            </button>
          </form>
        </div>
      )}

      {showAmountModal && selectedQuote && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Place Order</h3>
            <p>Quote Price: {formatNumber(selectedQuote.price)} per unit</p>
            <div className="form-group">
              <label>Amount (quantity/volume)</label>
              <input
                type="number"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={handlePlaceOrder} style={{ textTransform: 'none' }}>
                Place Order
              </button>
              <button className="btn btn-secondary" onClick={() => {
                setShowAmountModal(false);
                setOrderAmount('');
                setSelectedQuote(null);
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Sent List */}
        <div>
          <h2>Sent</h2>
          <input
            type="text"
            className="search-compact"
            placeholder="Search..."
            value={searchSent}
            onChange={(e) => setSearchSent(e.target.value)}
            style={{ marginBottom: '20px' }}
          />
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Supplier</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSent.length > 0 ? (
                  filteredSent.map(inq => (
                    <tr key={inq.id}>
                      <td>{inq.Ingredient?.name}</td>
                      <td>{inq.supplierUser?.name}</td>
                      <td>{new Date(inq.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center">No sent inquiries</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Received List */}
        <div>
          <h2>Received</h2>
          <input
            type="text"
            className="search-compact"
            placeholder="Search..."
            value={searchReceived}
            onChange={(e) => setSearchReceived(e.target.value)}
            style={{ marginBottom: '20px' }}
          />
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Supplier</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceived.length > 0 ? (
                  filteredReceived.map(inq => (
                    <tr key={inq.id}>
                      <td>{inq.Ingredient?.name}</td>
                      <td>{inq.supplierUser?.name}</td>
                      <td>{formatNumber(inq.quote?.price)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button
                            className="btn btn-small btn-primary"
                            style={{ minWidth: '90px', textTransform: 'none' }}
                            onClick={() => {
                              setSelectedQuote(inq.quote);
                              setShowAmountModal(true);
                            }}
                          >
                            Order
                          </button>
                          <button
                            className="btn btn-small btn-danger"
                            style={{ minWidth: '90px', textTransform: 'none' }}
                            onClick={() => handleCancelInquiry(inq.id)}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center">No received inquiries</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminInquiries;
