import React, { useState, useEffect } from 'react';
import { ingredientsAPI, suppliersAPI, catalogAPI } from '../../services/api';
import './Pages.css';

function Vendors() {
  const [catalogEntries, setCatalogEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('ingredient'); // ingredient or supplier
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [formMode, setFormMode] = useState('existing'); // existing or create
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newSupplierData, setNewSupplierData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  // Lists
  const [ingredients, setIngredients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [createdSupplierCredentials, setCreatedSupplierCredentials] = useState(null);

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch catalog entries
      const catalogRes = await catalogAPI.getAll();
      setCatalogEntries(catalogRes.data.data || []);

      // Fetch ingredients
      const ingRes = await ingredientsAPI.getAll('', 1, 1000);
      setIngredients(ingRes.data.ingredients || []);

      // Fetch suppliers
      const supRes = await suppliersAPI.getAll('', 1, 1000);
      setSuppliers(supRes.data.suppliers || []);

      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIngredient = async () => {
    if (!newIngredientName.trim()) {
      setError('Ingredient name required');
      return;
    }
    try {
      await ingredientsAPI.create({ name: newIngredientName });
      setNewIngredientName('');
      setFormMode('existing');
      await fetchAllData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating ingredient');
    }
  };

  const handleCreateSupplier = async () => {
    // Client-side validation (field-level)
    const errs = {};
    if (!newSupplierData.name) errs.name = 'Name required';
    if (!newSupplierData.email) errs.email = 'Email required';
    if (!newSupplierData.password) errs.password = 'Password required';
    // validate email
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newSupplierData.email && !emailRe.test(newSupplierData.email)) errs.email = 'Invalid email format';
    // validate phone: must be exactly 10 digits if provided
    if (newSupplierData.phone && !/^\d{10}$/.test(newSupplierData.phone)) errs.phone = 'Invalid phone number. Must be exactly 10 digits.';

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError('Please fix the highlighted fields');
      return;
    }
    setFieldErrors({});

    try {
      const res = await suppliersAPI.createSupplier(newSupplierData);
      setCreatedSupplierCredentials(res.data.credentials);
      setNewSupplierData({ name: '', email: '', phone: '', password: '' });
      setTimeout(() => {
        setShowNewSupplierModal(false);
        setCreatedSupplierCredentials(null);
        setError('');
        fetchAllData();
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating supplier');
    }
  };

  const handleAddEntry = async () => {
    let ingredientId = selectedIngredient;
    setError('');
    if (formMode === 'existing') {
      if (!ingredientId || !selectedSupplier) {
        setError('Please select both ingredient and supplier');
        return;
      }
    } else {
      if (!newIngredientName || !selectedSupplier) {
        setError('Ingredient name and supplier required');
        return;
      }
      // Create ingredient first
      try {
        const ingRes = await ingredientsAPI.create({ name: newIngredientName });
        ingredientId = ingRes.data.ingredient.id;
        // Refresh ingredients and select the new one
        const ingList = await ingredientsAPI.getAll('', 1, 1000);
        setIngredients(ingList.data.ingredients || []);
        setSelectedIngredient(ingredientId);
        setFormMode('existing');
        setNewIngredientName('');
      } catch (err) {
        setError(err.response?.data?.message || 'Error creating ingredient');
        return;
      }
    }

    try {
      await catalogAPI.create({
        ingredient_id: parseInt(ingredientId),
        supplier_user_id: parseInt(selectedSupplier),
        price_hint: null,
        available: true
      });
      setSelectedIngredient('');
      setSelectedSupplier('');
      setFormMode('existing');
      setShowForm(false);
      await fetchAllData();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding entry');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await catalogAPI.delete(id);
      await fetchAllData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting entry');
    }
  };

  // Sort and search: independent operations
  const getSortedEntries = () => {
    const sorted = [...catalogEntries];

    if (sortBy === 'ingredient') {
      // Sort by ingredient name, then by supplier name
      sorted.sort((a, b) => {
        const ingA = (a.Ingredient?.name || '').toLowerCase();
        const ingB = (b.Ingredient?.name || '').toLowerCase();
        if (ingA !== ingB) {
          return ingA.localeCompare(ingB);
        }
        const supA = (a.supplier?.name || '').toLowerCase();
        const supB = (b.supplier?.name || '').toLowerCase();
        return supA.localeCompare(supB);
      });
    } else if (sortBy === 'supplier') {
      // Sort by supplier name, then by ingredient name
      sorted.sort((a, b) => {
        const supA = (a.supplier?.name || '').toLowerCase();
        const supB = (b.supplier?.name || '').toLowerCase();
        if (supA !== supB) {
          return supA.localeCompare(supB);
        }
        const ingA = (a.Ingredient?.name || '').toLowerCase();
        const ingB = (b.Ingredient?.name || '').toLowerCase();
        return ingA.localeCompare(ingB);
      });
    }

    return sorted;
  };

  const filteredAndSortedEntries = getSortedEntries().filter(entry => {
    if (!search) return true;
    const ingredientName = entry.Ingredient?.name || '';
    const supplierName = entry.supplier?.name || '';
    const searchLower = search.toLowerCase();
    return ingredientName.toLowerCase().includes(searchLower) ||
      supplierName.toLowerCase().includes(searchLower);
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0 }}>Vendor Management</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={() => { setError(''); setFieldErrors({}); setShowNewSupplierModal(true); }}
          >
            Create New Supplier
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Add Entry'}
          </button>
        </div>
      </div>

      {error && !showNewSupplierModal && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h3>Add Vendor Entry</h3>

          {createdSupplierCredentials && (
            <div className="alert alert-success">
              <strong>Supplier Created!</strong><br />
              Name: {createdSupplierCredentials.name}<br />
              Email: {createdSupplierCredentials.email}<br />
              Password: {createdSupplierCredentials.password}
            </div>
          )}

          <div className="form-group">
            <label>Mode</label>
            <select
              value={formMode}
              onChange={(e) => setFormMode(e.target.value)}
            >
              <option value="existing">Use Existing</option>
              <option value="create">Create New Ingredient</option>
            </select>
          </div>

          {formMode === 'existing' ? (
            <div className="form-group">
              <label>Ingredient</label>
              <select
                value={selectedIngredient}
                onChange={(e) => setSelectedIngredient(e.target.value)}
              >
                <option value="">-- Select Ingredient --</option>
                {ingredients.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label>New Ingredient Name</label>
              <input
                type="text"
                value={newIngredientName}
                onChange={(e) => setNewIngredientName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: 12 }}>
            <button
              className="btn btn-primary"
              onClick={handleAddEntry}
              disabled={
                (formMode === 'existing' && (!selectedIngredient || !selectedSupplier)) ||
                (formMode === 'create' && (!newIngredientName || !selectedSupplier))
              }
            >
              Add Entry
            </button>
          </div>

          {/* New Supplier modal is rendered after the form-card to avoid nested JSX issues */}
        </div>
      )}

      {showNewSupplierModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Supplier</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>Name</label>
              <input
                className={fieldErrors.name ? 'input-invalid' : ''}
                type="text"
                value={newSupplierData.name}
                onChange={(e) => { setNewSupplierData({ ...newSupplierData, name: e.target.value }); setFieldErrors({ ...fieldErrors, name: '' }); setError(''); }}
              />
              {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                className={fieldErrors.email ? 'input-invalid' : ''}
                type="email"
                value={newSupplierData.email}
                onChange={(e) => { setNewSupplierData({ ...newSupplierData, email: e.target.value }); setFieldErrors({ ...fieldErrors, email: '' }); setError(''); }}
              />
              {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                className={fieldErrors.phone ? 'input-invalid' : ''}
                type="tel"
                value={newSupplierData.phone}
                onChange={(e) => { setNewSupplierData({ ...newSupplierData, phone: e.target.value }); setFieldErrors({ ...fieldErrors, phone: '' }); setError(''); }}
              />
              {fieldErrors.phone && <div className="field-error">{fieldErrors.phone}</div>}
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                className={fieldErrors.password ? 'input-invalid' : ''}
                type="password"
                value={newSupplierData.password}
                onChange={(e) => { setNewSupplierData({ ...newSupplierData, password: e.target.value }); setFieldErrors({ ...fieldErrors, password: '' }); setError(''); }}
              />
              {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={handleCreateSupplier}
                disabled={
                  Object.keys(fieldErrors).some(k => fieldErrors[k]) || !newSupplierData.name || !newSupplierData.email || !newSupplierData.password
                }
              >
                Create
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setShowNewSupplierModal(false); setError(''); setFieldErrors({}); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by ingredient or supplier name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="ingredient">Sort by Ingredient</option>
          <option value="supplier">Sort by Supplier</option>
        </select>
      </div>

      {loading && <p className="loading">Loading...</p>}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Supplier</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedEntries.length > 0 ? (
              filteredAndSortedEntries.map(entry => (
                <tr key={entry.id}>
                  <td>{entry.Ingredient?.name}</td>
                  <td>{entry.supplier?.name}</td>
                  <td>{entry.supplier?.email}</td>
                  <td>{entry.supplier?.phone || '-'}</td>
                  <td>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">No entries found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Vendors;
