import React, { useState, useEffect } from 'react';
import { inquiriesAPI, quotesAPI } from '../../services/api';
import './Pages.css';
import { formatNumber, formatDate } from '../../utils/format';

function SupplierInquiries() {
  const [pendingInquiries, setPendingInquiries] = useState([]);
  const [sentQuotes, setSentQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPending, setSearchPending] = useState('');
  const [searchSent, setSearchSent] = useState('');

  // Quoting State
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteInputs, setQuoteInputs] = useState({}); // Map of inquiryItemId_brandName -> { price, isNil }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inqRes, quotesRes] = await Promise.all([
        inquiriesAPI.getAll(1, 1000),
        quotesAPI.getAll()
      ]);

      const allInquiries = inqRes.data.data || [];
      const allQuotes = quotesRes.data.data || [];

      // Filter inquiries that already have a quote
      const quotedInquiryIds = new Set(allQuotes.map(q => q.inquiry_id));

      const pending = allInquiries.filter(inq => !quotedInquiryIds.has(inq.id));

      setPendingInquiries(pending);
      setSentQuotes(allQuotes);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const openQuoteModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    // Initialize inputs
    const initialInputs = {};
    inquiry.InquiryItems?.forEach(item => {
      const brands = item.brands && item.brands.length > 0 ? item.brands : ['Any'];
      brands.forEach(brand => {
        const key = `${item.id}_${brand}`;
        initialInputs[key] = { price: '', isNil: false };
      });
    });
    setQuoteInputs(initialInputs);
    setShowQuoteModal(true);
  };

  const handleInputChange = (itemId, brand, field, value) => {
    const key = `${itemId}_${brand}`;
    setQuoteInputs(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const handleSubmitQuote = async () => {
    try {
      const itemsPayload = [];

      // Validate and build payload
      for (const item of selectedInquiry.InquiryItems) {
        const brands = item.brands && item.brands.length > 0 ? item.brands : ['Any'];
        for (const brand of brands) {
          const key = `${item.id}_${brand}`;
          const input = quoteInputs[key];

          if (!input.isNil && (!input.price || parseFloat(input.price) <= 0)) {
            setError(`Please enter a valid price for ${item.Ingredient?.name} (${brand}) or mark as Nil`);
            return;
          }

          itemsPayload.push({
            inquiry_item_id: item.id,
            brand_name: brand,
            price: input.isNil ? null : parseFloat(input.price),
            is_nil: input.isNil
          });
        }
      }

      await quotesAPI.create({
        inquiry_id: selectedInquiry.id,
        items: itemsPayload
      });

      setShowQuoteModal(false);
      setSelectedInquiry(null);
      setQuoteInputs({});
      await fetchData(); // Refresh lists
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting quote');
    }
  };

  // Filtering
  const filteredPending = pendingInquiries.filter(inq => {
    const searchLower = searchPending.toLowerCase();
    const creatorMatch = inq.creator?.name.toLowerCase().includes(searchLower);
    const itemMatch = inq.InquiryItems?.some(item =>
      item.Ingredient?.name.toLowerCase().includes(searchLower) ||
      (item.brands || []).some(b => b.toLowerCase().includes(searchLower))
    );
    return creatorMatch || itemMatch;
  });

  const filteredSent = sentQuotes.filter(q => {
    // Filter out quotes that have been turned into orders
    if (q.status === 'order_placed') return false;

    const searchLower = searchSent.toLowerCase();
    const noteMatch = q.Inquiry?.notes?.toLowerCase().includes(searchLower);
    const idMatch = q.id.toString().includes(searchLower);
    const itemMatch = q.QuoteItems?.some(item =>
      item.InquiryItem?.Ingredient?.name.toLowerCase().includes(searchLower) ||
      item.brand_name?.toLowerCase().includes(searchLower)
    );
    return noteMatch || idMatch || itemMatch;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Inquiries Management</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showQuoteModal && selectedInquiry && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            {/* Heading removed per request */}
            <div style={{ maxHeight: '60vh', overflowY: 'auto', marginBottom: '20px' }}>
              {selectedInquiry.InquiryItems?.map(item => {
                const brands = item.brands && item.brands.length > 0 ? item.brands : ['Any'];
                return (
                  <div key={item.id} style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <h4 style={{ fontSize: '1.3em' }}>{item.Ingredient?.name} <span style={{ fontSize: '0.8em', fontWeight: 'normal' }}>({item.quantity} {item.Ingredient?.unit === 'unit' ? 'units' : item.Ingredient?.unit})</span></h4>

                    {brands.map(brand => {
                      const key = `${item.id}_${brand}`;
                      const input = quoteInputs[key] || { price: '', isNil: false };

                      return (
                        <div key={brand} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                          <span style={{ width: '150px', fontWeight: 'bold' }}>{brand}</span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <label>Price:</label>
                            <input
                              type="number"
                              value={input.price}
                              onChange={(e) => handleInputChange(item.id, brand, 'price', e.target.value)}
                              disabled={input.isNil}
                              style={{ width: '100px' }}
                              min="0"
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                              type="checkbox"
                              className="custom-checkbox"
                              checked={input.isNil}
                              onChange={(e) => handleInputChange(item.id, brand, 'isNil', e.target.checked)}
                            />
                            <label>No Stock</label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowQuoteModal(false)}>CANCEL</button>
              <button className="btn btn-primary" onClick={handleSubmitQuote}>Submit Quotes</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Pending Inquiries */}
        <div>
          <h2>Pending Inquiries</h2>
          <input
            type="text"
            className="search-compact"
            placeholder="Search..."
            value={searchPending}
            onChange={(e) => setSearchPending(e.target.value)}
            style={{ marginBottom: '10px' }}
          />
          <div className="table-container">
            {filteredPending.length > 0 ? (
              filteredPending.map(inq => (
                <div key={inq.id} className="card" style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd' }}>
                  <table className="table" style={{ fontSize: '0.9em' }}>
                    <thead>
                      <tr>
                        <th>Ingredient</th>
                        <th>Brands</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inq.InquiryItems?.map(item => (
                        <tr key={item.id}>
                          <td>{item.Ingredient?.name}</td>
                          <td>
                            {item.brands && item.brands.length > 0 ? (
                              <span style={{ fontSize: '0.9em', color: '#666' }}>
                                {item.brands.join(', ')}
                              </span>
                            ) : 'Any'}
                          </td>
                          <td>{item.quantity} {item.Ingredient?.unit === 'unit' ? 'units' : item.Ingredient?.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: '0.9em' }}>{formatDate(inq.created_at)}</span>
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => openQuoteModal(inq)}
                    >
                      Send Quotes
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                No pending inquiries
              </div>
            )}
          </div>
        </div>

        {/* Sent Quotes */}
        <div>
          <h2>Sent Quotes</h2>
          <input
            type="text"
            className="search-compact"
            placeholder="Search..."
            value={searchSent}
            onChange={(e) => setSearchSent(e.target.value)}
            style={{ marginBottom: '10px' }}
          />
          <div className="table-container">
            {filteredSent.length > 0 ? (
              filteredSent.map(quote => (
                <div key={quote.id} className="card" style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
                    <span>{formatDate(quote.created_at)}</span>
                  </div>

                  <table className="table" style={{ fontSize: '0.9em' }}>
                    <thead>
                      <tr>
                        <th>Ingredient</th>
                        <th>Brand</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.QuoteItems?.map(item => (
                        <tr key={item.id} style={{ backgroundColor: item.is_nil ? '#f9f9f9' : 'white' }}>
                          <td>{item.InquiryItem?.Ingredient?.name}</td>
                          <td>{item.brand_name}</td>
                          <td>{item.is_nil ? 'NIL' : formatNumber(item.price)}</td>
                          <td>{item.is_nil ? '-' : formatNumber(item.price * item.InquiryItem?.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                No sent quotes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplierInquiries;
