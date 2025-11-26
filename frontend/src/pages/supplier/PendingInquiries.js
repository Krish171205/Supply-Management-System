import React, { useState, useEffect } from 'react';
import { inquiriesAPI, ordersAPI } from '../../services/api';
import '../admin/Pages.css';

function PendingInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quotes, setQuotes] = useState({});

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const response = await inquiriesAPI.getAll();
      setInquiries(response.data.data || response.data.inquiries || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteChange = (inquiryId, value) => {
    setQuotes(prev => ({
      ...prev,
      [inquiryId]: value
    }));
  };

  const handleSubmitQuote = async (inquiryId) => {
    if (!quotes[inquiryId] || isNaN(quotes[inquiryId])) {
      setError('Please enter a valid price');
      return;
    }

    try {
      await ordersAPI.create(inquiryId, parseFloat(quotes[inquiryId]));
      setQuotes(prev => {
        const newQuotes = { ...prev };
        delete newQuotes[inquiryId];
        return newQuotes;
      });
      fetchInquiries();
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting quote');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Pending Inquiries</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && <p className="loading">Loading...</p>}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Status</th>
              <th>Your Quote</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length > 0 ? (
              inquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td>{inquiry.Ingredient?.name}</td>
                  <td><span className="badge">{inquiry.status}</span></td>
                  <td>
                    {inquiry.status === 'open' ? (
                      <input
                        type="number"
                        placeholder="Enter price"
                        value={quotes[inquiry.id] || ''}
                        onChange={(e) => handleQuoteChange(inquiry.id, e.target.value)}
                        step="0.01"
                      />
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>
                    {inquiry.status === 'open' && (
                      <button
                        className="btn btn-small btn-primary"
                        onClick={() => handleSubmitQuote(inquiry.id)}
                      >
                        Submit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">No pending inquiries</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PendingInquiries;
