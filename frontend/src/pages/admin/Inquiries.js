import React, { useState, useEffect } from 'react';
import { inquiriesAPI, ingredientsAPI, suppliersAPI } from '../../services/api';
import './Pages.css';

function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ingredientId: '', supplierIds: [] });
  const [ingredients, setIngredients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetchInquiries();
    fetchIngredientsAndSuppliers();
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

  const fetchIngredientsAndSuppliers = async () => {
    try {
      const [ing, sup] = await Promise.all([
        ingredientsAPI.getAll('', 1, 100),
        suppliersAPI.getAll('', 1, 100)
      ]);
      setIngredients(ing.data.ingredients);
      setSuppliers(sup.data.suppliers);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleCreateInquiry = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Backend expects: ingredient_id, supplier_user_id, notes
      // For simplicity, create one inquiry per supplier
      for (const supplierId of formData.supplierIds) {
        await inquiriesAPI.create({
          ingredient_id: parseInt(formData.ingredientId),
          supplier_user_id: parseInt(supplierId),
          notes: ''
        });
      }
      setFormData({ ingredientId: '', supplierIds: [] });
      setShowForm(false);
      fetchInquiries();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Inquiries Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Send Inquiry'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleCreateInquiry}>
          <h3>Send New Inquiry</h3>
          <div className="form-group">
            <label>Ingredient *</label>
            <select
              value={formData.ingredientId}
              onChange={(e) => setFormData({ ...formData, ingredientId: e.target.value })}
              required
              disabled={loading}
            >
              <option value="">Select an ingredient</option>
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.id}>{ing.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Suppliers (select at least one) *</label>
            {suppliers.map(sup => (
              <label key={sup.id} style={{ display: 'block', marginTop: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.supplierIds.includes(sup.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        supplierIds: [...formData.supplierIds, sup.id]
                      });
                    } else {
                      setFormData({
                        ...formData,
                        supplierIds: formData.supplierIds.filter(s => s !== sup.id)
                      });
                    }
                  }}
                  disabled={loading}
                />
                {' '}{sup.name || sup.email}
              </label>
            ))}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || formData.supplierIds.length === 0}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      )}

      {loading && <p className="loading">Loading...</p>}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ingredient</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Responses</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length > 0 ? (
              inquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td>#{inquiry.id}</td>
                  <td>{inquiry.Ingredient?.name}</td>
                  <td>-</td>
                  <td><span className="badge">{inquiry.status}</span></td>
                  <td>-</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">No inquiries found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Inquiries;
