import React, { useState, useEffect } from 'react';
import { inquiriesAPI, ingredientsAPI, suppliersAPI, quotesAPI } from '../../services/api';
import './Pages.css';
import { formatNumber, formatDate } from '../../utils/format';

import MultiSelectDropdown from '../../components/Common/MultiSelectDropdown';
import Toast from '../../components/Common/Toast';

function AdminInquiries() {
  const [sentInquiries, setSentInquiries] = useState([]);
  const [receivedQuotes, setReceivedQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchSent, setSearchSent] = useState('');
  const [searchReceived, setSearchReceived] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State
  const [selectedIngredient, setSelectedIngredient] = useState([]); // Array of IDs
  const [selectedSupplier, setSelectedSupplier] = useState([]); // Array of IDs
  const [selectedBrands, setSelectedBrands] = useState({}); // Map of ingredientId -> [brands]
  const [selectedQuantities, setSelectedQuantities] = useState({}); // Map of ingredientId -> quantity
  const [ingredientOptions, setIngredientOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [notes, setNotes] = useState('');

  // Order Selection State (Map of quoteId -> [quoteItemId])
  const [selectedOrderItems, setSelectedOrderItems] = useState({});

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Sent Inquiries
      const inqRes = await inquiriesAPI.getAll(1, 1000);
      let inquiries = inqRes.data.data || [];

      // Fetch Received Quotes
      const quotesRes = await quotesAPI.getAll();
      const quotes = quotesRes.data.data || [];

      // Filter logic:
      const quotedInquiryIds = new Set(quotes.map(q => q.inquiry_id));
      const pendingInquiries = inquiries.filter(inq => !quotedInquiryIds.has(inq.id));

      setSentInquiries(pendingInquiries);
      setReceivedQuotes(quotes);

      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching data');
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
    if (selectedIngredient.length === 0) return setError('Select at least one ingredient');
    if (selectedSupplier.length === 0) return setError('Select at least one supplier');

    // Validate quantities
    for (const ingId of selectedIngredient) {
      const qty = selectedQuantities[ingId];
      if (!qty || parseFloat(qty) <= 0) {
        return setError(`Please enter a valid quantity greater than 0 for all ingredients`);
      }
    }

    try {
      const ingredientsPayload = selectedIngredient.map(id => ({
        id,
        brands: selectedBrands[id] || [],
        quantity: selectedQuantities[id] || null
      }));

      await inquiriesAPI.create({
        ingredients: ingredientsPayload,
        supplier_user_id: selectedSupplier,
        notes
      });

      // Reset form
      setSelectedIngredient([]);
      setSelectedSupplier([]);
      setSelectedBrands({});
      setSelectedQuantities({});
      setNotes('');
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating inquiry');
    }
  };



  // Pre-select brands
  useEffect(() => {
    if (selectedIngredient.length > 0) {
      const newBrands = { ...selectedBrands };
      let changed = false;
      selectedIngredient.forEach(ingId => {
        if (!newBrands[ingId]) {
          const ing = ingredientOptions.find(i => i.id === ingId);
          if (ing && ing.brands && ing.brands.length > 0) {
            newBrands[ingId] = ing.brands;
            changed = true;
          }
        }
      });
      if (changed) setSelectedBrands(newBrands);
    }
  }, [selectedIngredient, ingredientOptions]);

  const toggleOrderItem = (quoteId, itemId) => {
    setSelectedOrderItems(prev => {
      const current = prev[quoteId] || [];
      if (current.includes(itemId)) {
        return { ...prev, [quoteId]: current.filter(id => id !== itemId) };
      } else {
        return { ...prev, [quoteId]: [...current, itemId] };
      }
    });
  };

  const handlePlaceOrder = async (quoteId) => {
    const items = selectedOrderItems[quoteId] || [];
    if (items.length === 0) return setToast({ message: 'Please select at least one item to order', type: 'error' });

    try {
      await quotesAPI.accept(quoteId, items);
      // Force refresh data to remove the ordered quote from the list
      await fetchData();
      setSelectedOrderItems(prev => {
        const newState = { ...prev };
        delete newState[quoteId];
        return newState;
      });
      setToast({ message: 'Order Placed Successfully', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Error placing order', type: 'error' });
    }
  };

  const handleRemoveQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to remove this quote? This action cannot be undone.')) return;

    try {
      await quotesAPI.delete(quoteId);
      await fetchData();
      setToast({ message: 'Quote Removed Successfully', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Error removing quote', type: 'error' });
    }
  };

  // Filtering
  const filteredSent = sentInquiries.filter(inq => {
    const searchLower = searchSent.toLowerCase();
    const supplierMatch = inq.supplierUser?.name.toLowerCase().includes(searchLower);
    const ingredientMatch = inq.InquiryItems?.some(item =>
      item.Ingredient?.name.toLowerCase().includes(searchLower) ||
      (item.brands && item.brands.some(b => b.toLowerCase().includes(searchLower)))
    );
    return supplierMatch || ingredientMatch;
  });

  const filteredReceived = receivedQuotes.filter(q => {
    if (q.status === 'order_placed') return false; // Filter out accepted quotes

    const searchLower = searchReceived.toLowerCase();
    const supplierMatch = q.supplier?.name.toLowerCase().includes(searchLower);
    const itemMatch = q.QuoteItems?.some(item =>
      item.InquiryItem?.Ingredient?.name.toLowerCase().includes(searchLower) ||
      item.brand_name?.toLowerCase().includes(searchLower)
    );
    return supplierMatch || itemMatch;
  });

  return (
    <div className="page-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="page-header">
        <h1>Inquiries Management</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Inquiry'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h3>Create Inquiry</h3>
          <form onSubmit={handleCreateInquiry}>
            <div className="form-group">
              <label>Ingredients</label>
              <MultiSelectDropdown
                options={ingredientOptions}
                selectedIds={selectedIngredient}
                onChange={setSelectedIngredient}
                placeholder="Select Ingredients"
              />
            </div>

            {selectedIngredient.map(ingId => {
              const ing = ingredientOptions.find(i => i.id === ingId);
              if (!ing) return null;
              const brandOptions = (ing.brands || []).map(b => ({ id: b, name: b }));

              return (
                <div key={ingId} style={{ marginLeft: '20px', borderLeft: '2px solid #eee', paddingLeft: '10px', marginBottom: '15px' }}>
                  <h4>{ing.name}</h4>
                  {ing.brands?.length > 0 && (
                    <div className="form-group">
                      <label>Brands</label>
                      <MultiSelectDropdown
                        options={brandOptions}
                        selectedIds={selectedBrands[ingId] || []}
                        onChange={(ids) => setSelectedBrands(prev => ({ ...prev, [ingId]: ids }))}
                        placeholder="Select Brands"
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Quantity ({ing.unit === 'unit' ? 'units' : (ing.unit || 'kg')})</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedQuantities[ingId] || ''}
                      onChange={(e) => setSelectedQuantities(prev => ({ ...prev, [ingId]: e.target.value }))}
                      placeholder="Enter quantity"
                    />
                  </div>
                </div>
              );
            })}

            <div className="form-group">
              <label>Suppliers</label>
              <MultiSelectDropdown
                options={supplierOptions}
                selectedIds={selectedSupplier}
                onChange={setSelectedSupplier}
                placeholder="Select Suppliers"
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary">Send Inquiry</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Sent List */}
        <div>
          <h2>Sent Inquiries</h2>
          <input
            type="text"
            className="search-compact"
            placeholder="Search Supplier..."
            value={searchSent}
            onChange={(e) => setSearchSent(e.target.value)}
            style={{ marginBottom: '10px' }}
          />
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Ingredients</th>
                  <th>Quantity</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSent.length > 0 ? (
                  filteredSent.map(inq => (
                    <React.Fragment key={inq.id}>
                      {inq.InquiryItems?.map((item, idx) => {
                        const isLastItem = idx === inq.InquiryItems.length - 1;
                        return (
                          <tr key={item.id}>
                            {idx === 0 && (
                              <td rowSpan={inq.InquiryItems.length} style={{ verticalAlign: 'middle' }}>
                                {inq.supplierUser?.name}
                              </td>
                            )}
                            <td style={{ borderBottom: isLastItem ? undefined : 'none' }}>
                              {item.Ingredient?.name}
                              {item.brands?.length > 0 && (
                                <div style={{ color: '#666', fontSize: '0.9em' }}>
                                  {item.brands.join(', ')}
                                </div>
                              )}
                            </td>
                            <td style={{ borderBottom: isLastItem ? undefined : 'none' }}>
                              {item.quantity} {item.Ingredient?.unit === 'unit' ? 'units' : item.Ingredient?.unit}
                            </td>
                            {idx === 0 && (
                              <td rowSpan={inq.InquiryItems.length} style={{ verticalAlign: 'middle' }}>
                                {formatDate(inq.created_at)}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center">No pending inquiries</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Received Quotes */}
        <div>
          <h2>Received Quotes</h2>
          <input
            type="text"
            className="search-compact"
            placeholder="Search Supplier..."
            value={searchReceived}
            onChange={(e) => setSearchReceived(e.target.value)}
            style={{ marginBottom: '10px' }}
          />
          <div className="table-container">
            {filteredReceived.length > 0 ? (
              filteredReceived.map(quote => (
                <div key={quote.id} className="card" style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong>From: {quote.supplier?.name}</strong>
                    <span>{formatDate(quote.created_at)}</span>
                  </div>

                  <table className="table" style={{ fontSize: '0.9em' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '30px' }}></th>
                        <th>Ingredient</th>
                        <th>Brand</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.QuoteItems?.map(item => (
                        <tr key={item.id} style={{ backgroundColor: item.is_nil ? '#f9f9f9' : 'white' }}>
                          <td>
                            {!item.is_nil && quote.status !== 'order_placed' && (
                              <input
                                type="checkbox"
                                className="custom-checkbox"
                                checked={(selectedOrderItems[quote.id] || []).includes(item.id)}
                                onChange={() => toggleOrderItem(quote.id, item.id)}
                              />
                            )}
                          </td>
                          <td>{item.InquiryItem?.Ingredient?.name}</td>
                          <td>{item.brand_name}</td>
                          <td>{item.InquiryItem?.quantity} {item.InquiryItem?.Ingredient?.unit === 'unit' ? 'units' : item.InquiryItem?.Ingredient?.unit}</td>
                          <td>{item.is_nil ? 'NIL' : formatNumber(item.price)}</td>
                          <td>{item.is_nil ? '-' : formatNumber(item.price * item.InquiryItem?.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: '10px', textAlign: 'right' }}>
                    {quote.status === 'order_placed' ? (
                      <span className="badge badge-success">Order Placed</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        onClick={() => handlePlaceOrder(quote.id)}
                        disabled={(selectedOrderItems[quote.id] || []).length === 0}
                      >
                        Place Order
                      </button>
                    )}
                    {quote.status !== 'order_placed' && (
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        style={{ marginLeft: '10px' }}
                        onClick={() => handleRemoveQuote(quote.id)}
                      >
                        REMOVE
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                No received quotes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminInquiries;
