import React, { useState, useEffect } from 'react';
import { suppliersAPI, authAPI } from '../../services/api';
import './Pages.css';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', additional_emails: [] });
  const [credentials, setCredentials] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, [search, page]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await suppliersAPI.getAll(search, page);
      setSuppliers(response.data.suppliers);
      setPagination(response.data.pagination);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.createSupplier(formData);
      setCredentials(response.data.credentials);
      setFormData({ name: '', email: '', phone: '', password: '', additional_emails: [] });
      setTimeout(() => {
        setShowForm(false);
        fetchSuppliers();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Suppliers Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            setCredentials(null);
          }}
        >
          {showForm ? 'Cancel' : '+ Add Supplier'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {credentials && (
        <div className="alert alert-success">
          <strong>Supplier Created!</strong><br />
          Name: {credentials.name}<br />
          Email: {credentials.email}<br />
          Password: {credentials.password}<br />
          <small>Please save these credentials and share with the supplier.</small>
        </div>
      )}

      {showForm && (
        <form className="form-card" onSubmit={handleCreateSupplier}>
          <h3>Add New Supplier</h3>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
              required
            />
          </div>
          <div className="form-group">
            <label>Additional Emails</label>
            {formData.additional_emails.map((email, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '5px', alignItems: 'center' }}>
                <input
                  style={{ flex: 1 }}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const newEmails = [...formData.additional_emails];
                    newEmails[index] = e.target.value;
                    setFormData({ ...formData, additional_emails: newEmails });
                  }}
                  placeholder="Additional Email"
                />
                <button
                  type="button"
                  className="btn btn-small btn-danger"
                  style={{ width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}
                  onClick={() => {
                    const newEmails = formData.additional_emails.filter((_, i) => i !== index);
                    setFormData({ ...formData, additional_emails: newEmails });
                  }}
                >
                  X
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-small btn-secondary"
              onClick={() => setFormData({ ...formData, additional_emails: [...formData.additional_emails, ''] })}
            >
              + Add Email
            </button>
          </div>
          <div className="form-group">
            <label>Phone (optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading && <p className="loading">Loading...</p>}

      <div className="grid">
        {suppliers.length > 0 ? (
          suppliers.map((supplier) => (
            <div key={supplier.id} className="card">
              <h3>{supplier.name}</h3>
              <p><strong>Email:</strong> {supplier.email || '-'}</p>
              {supplier.additional_emails && supplier.additional_emails.length > 0 && (
                <p><strong>Other Emails:</strong> {supplier.additional_emails.join(', ')}</p>
              )}
              <p><strong>Phone:</strong> {supplier.phone || '-'}</p>
              <p><strong>Role:</strong> {supplier.role}</p>
            </div>
          ))
        ) : (
          <p className="text-center">No suppliers found</p>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`btn btn-small ${page === p ? 'active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Suppliers;
