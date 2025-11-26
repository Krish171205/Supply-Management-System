import React, { useState, useEffect } from 'react';
import { inquiriesAPI, ordersAPI } from '../../services/api';
import './Pages.css';
import { formatNumber } from '../../utils/format';

function SupplierInquiries() {
  const [pendingInquiries, setPendingInquiries] = useState([]);
  const [sentInquiries, setSentInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPending, setSearchPending] = useState('');
  const [searchSent, setSearchSent] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceInput, setPriceInput] = useState('');

  useEffect(() => {
    fetchAllInquiriesAndQuotes();
  }, []);

  const [sentQuotesMap, setSentQuotesMap] = useState({});

  const fetchAllInquiriesAndQuotes = async () => {
    setLoading(true);
    try {
      // Fetch inquiries for current user (supplier)
      const [inqRes, quotesRes] = await Promise.all([
        inquiriesAPI.getAll(1, 1000),
        ordersAPI.getSupplierAll('', 1, 1000)
      ]);
      const allInquiries = inqRes.data.data || [];
      const allQuotes = quotesRes.data.data || [];

      // Build a Map of inquiry_id -> quote for sent inquiries
      const sentQuotes = {};
      const quotedInquiryIds = new Set();
      for (const q of allQuotes) {
        sentQuotes[q.inquiry_id] = q;
        quotedInquiryIds.add(q.inquiry_id);
      }

      // Split into pending (no quote) and sent (has quote)
      const pending = [];
      const sent = [];
      for (const inq of allInquiries) {
        if (quotedInquiryIds.has(inq.id)) {
          sent.push(inq);
        } else {
          pending.push(inq);
        }
      }

      setPendingInquiries(pending);
      setSentInquiries(sent);
      setSentQuotesMap(sentQuotes);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPrice = async () => {
    if (!priceInput || isNaN(priceInput) || priceInput <= 0) {
      setError('Please enter a valid price');
      return;
    }

    try {
      // Create quote for this inquiry via POST /quotes
      await ordersAPI.create(selectedInquiry.id, parseFloat(priceInput));

      setPriceInput('');
      setShowPriceModal(false);
      setSelectedInquiry(null);
      // Move inquiry to sent list by refetching
      await fetchAllInquiriesAndQuotes();
    } catch (err) {
      // Show backend error message as-is for clarity
      setError(err.response?.data?.message || err.message || 'Error sending price');
    }
  };

  const filteredPending = pendingInquiries
    .filter(inq => {
      const text = `${inq.Ingredient?.name}`.toLowerCase();
      return text.includes(searchPending.toLowerCase());
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filteredSent = sentInquiries
    .filter(inq => {
      const text = `${inq.Ingredient?.name}`.toLowerCase();
      return text.includes(searchSent.toLowerCase());
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const InquiryTable = ({ title, inquiries, searchTerm, onSearch, onAction, canRespond, showPrice }) => (
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
              <th>Date</th>
              {showPrice && <th>Price Set</th>}
              {canRespond && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {inquiries.length > 0 ? (
              inquiries.map(inq => (
                <tr key={inq.id}>
                  <td>{inq.Ingredient?.name}</td>
                  <td>{new Date(inq.created_at).toLocaleDateString()}</td>
                  {showPrice && (
                    <td>
                      {sentQuotesMap[inq.id]?.price ? (
                        <span>{formatNumber(sentQuotesMap[inq.id].price)}</span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  )}
                  {canRespond && (
                    <td>
                      <button
                        className="btn btn-small btn-primary"
                        style={{ textTransform: 'none' }}
                        onClick={() => onAction(inq)}
                      >
                        Send Price
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canRespond ? (showPrice ? 4 : 3) : (showPrice ? 3 : 2)} className="text-center">
                  No inquiries
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
        <h1>Inquiries</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="loading">Loading...</p>}

      {showPriceModal && selectedInquiry && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Send Price for {selectedInquiry.Ingredient?.name}</h3>
            <div className="form-group">
              <label>Price per Unit (per kg/L)</label>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="Enter price"
                min="0"
                step="0.01"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={handleSendPrice} style={{ textTransform: 'none' }}>
                Send
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowPriceModal(false);
                  setPriceInput('');
                  setSelectedInquiry(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <InquiryTable
          title="Pending (Received from Admin)"
          inquiries={filteredPending}
          searchTerm={searchPending}
          onSearch={(e) => setSearchPending(e.target.value)}
          onAction={(inq) => {
            setSelectedInquiry(inq);
            setShowPriceModal(true);
          }}
          canRespond={true}
          showPrice={false}
        />
        <InquiryTable
          title="Sent (Price Submitted)"
          inquiries={filteredSent}
          searchTerm={searchSent}
          onSearch={(e) => setSearchSent(e.target.value)}
          canRespond={false}
          showPrice={true}
        />
      </div>
    </div>
  );
}

export default SupplierInquiries;
