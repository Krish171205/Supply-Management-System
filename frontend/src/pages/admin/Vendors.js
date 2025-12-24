import React, { useState, useEffect } from 'react';
import { ingredientsAPI, suppliersAPI, catalogAPI } from '../../services/api';
import MultiSelectDropdown from '../../components/Common/MultiSelectDropdown';
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
  // Form states
  const [selectedIngredients, setSelectedIngredients] = useState([]); // Array of IDs
  const [selectedSuppliers, setSelectedSuppliers] = useState([]); // Array of IDs
  const [newSupplierData, setNewSupplierData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    additional_emails: [],
    payment_type: 'advance'
  });

  // New Ingredient Modal State
  const [showNewIngredientModal, setShowNewIngredientModal] = useState(false);
  const [newIngredientData, setNewIngredientData] = useState({
    name: '',
    brands: [],
    unit: 'kg'
  });
  const [newBrandInput, setNewBrandInput] = useState('');

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
      setNewSupplierData({ name: '', email: '', phone: '', password: '', additional_emails: [], payment_type: 'advance' });
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

  const handleCreateIngredient = async () => {
    if (!newIngredientData.name.trim()) {
      setError('Ingredient name required');
      return;
    }

    try {
      await ingredientsAPI.create({
        name: newIngredientData.name,
        brands: newIngredientData.brands,
        unit: newIngredientData.unit
      });

      setNewIngredientData({ name: '', brands: [], unit: 'kg' });
      setNewBrandInput('');
      setShowNewIngredientModal(false);
      setError('');
      fetchAllData(); // Refresh ingredients list
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating ingredient');
    }
  };

  const handleAddBrand = (e) => {
    e.preventDefault();
    if (newBrandInput.trim()) {
      setNewIngredientData({
        ...newIngredientData,
        brands: [...newIngredientData.brands, newBrandInput.trim()]
      });
      setNewBrandInput('');
    }
  };

  const handleRemoveBrand = (index) => {
    const updatedBrands = newIngredientData.brands.filter((_, i) => i !== index);
    setNewIngredientData({ ...newIngredientData, brands: updatedBrands });
  };

  const handleAddEntry = async () => {
    setError('');

    if (selectedSuppliers.length === 0) {
      setError('Please select at least one supplier');
      return;
    }

    if (selectedIngredients.length === 0) {
      setError('Please select at least one ingredient');
      return;
    }

    try {
      // Send arrays to backend
      await catalogAPI.create({
        ingredient_id: selectedIngredients,
        supplier_user_id: selectedSuppliers,
        price_hint: null,
        available: true
      });

      // Reset form
      setSelectedIngredients([]);
      setSelectedSuppliers([]);
      setShowForm(false);
      await fetchAllData();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding entries');
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
    const brandsStr = (entry.Ingredient?.brands || []).join(' ');
    const searchLower = search.toLowerCase();
    return ingredientName.toLowerCase().includes(searchLower) ||
      supplierName.toLowerCase().includes(searchLower) ||
      brandsStr.toLowerCase().includes(searchLower);
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
            onClick={() => { setError(''); setShowNewIngredientModal(true); }}
          >
            Create New Ingredient
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
            <label>Ingredients</label>
            <MultiSelectDropdown
              options={ingredients}
              selectedIds={selectedIngredients}
              onChange={setSelectedIngredients}
              placeholder="Select Ingredients..."
            />
          </div>

          <div className="form-group">
            <label>Suppliers</label>
            <MultiSelectDropdown
              options={suppliers}
              selectedIds={selectedSuppliers}
              onChange={setSelectedSuppliers}
              placeholder="Select Suppliers..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: 12 }}>
            <button
              className="btn btn-primary"
              onClick={handleAddEntry}
              disabled={selectedIngredients.length === 0 || selectedSuppliers.length === 0}
            >
              Add Entries
            </button>
          </div>
        </div>
      )}

      {showNewIngredientModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Ingredient</h3>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={newIngredientData.name}
                onChange={(e) => setNewIngredientData({ ...newIngredientData, name: e.target.value })}
                placeholder="Ingredient Name"
              />
            </div>

            <div className="form-group">
              <label>Measurement Unit</label>
              <select
                value={newIngredientData.unit}
                onChange={(e) => setNewIngredientData({ ...newIngredientData, unit: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="units">units</option>
                <option value="pieces">pieces</option>
              </select>
            </div>

            <div className="form-group">
              <label>Brands</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newBrandInput}
                  onChange={(e) => setNewBrandInput(e.target.value)}
                  placeholder="Enter brand name"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddBrand(e)}
                />
                <button type="button" className="btn btn-secondary" onClick={handleAddBrand}>Add</button>
              </div>
              <div className="brands-tags" style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {newIngredientData.brands.map((brand, index) => (
                  <span key={index} className="tag" style={{ background: '#e0e0e0', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {brand}
                    <button type="button" onClick={() => handleRemoveBrand(index)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'red', fontWeight: 'bold' }}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={handleCreateIngredient}
                disabled={!newIngredientData.name}
              >
                Create
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setShowNewIngredientModal(false); setError(''); setNewIngredientData({ name: '', brands: [], unit: 'kg' }); }}
              >
                Cancel
              </button>
            </div>
          </div>
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
              <label>Additional Emails</label>
              {newSupplierData.additional_emails.map((email, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '5px', alignItems: 'center' }}>
                  <input
                    style={{ flex: 1 }}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const newEmails = [...newSupplierData.additional_emails];
                      newEmails[index] = e.target.value;
                      setNewSupplierData({ ...newSupplierData, additional_emails: newEmails });
                    }}
                    placeholder="Additional Email"
                  />
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    style={{ width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}
                    onClick={() => {
                      const newEmails = newSupplierData.additional_emails.filter((_, i) => i !== index);
                      setNewSupplierData({ ...newSupplierData, additional_emails: newEmails });
                    }}
                  >
                    X
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-small btn-secondary"
                onClick={() => setNewSupplierData({ ...newSupplierData, additional_emails: [...newSupplierData.additional_emails, ''] })}
              >
                + Add Email
              </button>
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
            <div className="form-group">
              <label>Payment Type</label>
              <select
                value={newSupplierData.payment_type}
                onChange={(e) => setNewSupplierData({ ...newSupplierData, payment_type: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="advance">Advance</option>
                <option value="credit">Credit</option>
              </select>
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
                  <td>
                    {entry.Ingredient?.name}
                    {entry.Ingredient?.brands && entry.Ingredient.brands.length > 0 && (
                      <div style={{ fontSize: '0.8em', color: '#666' }}>
                        {entry.Ingredient.brands.join(', ')}
                      </div>
                    )}

                  </td>
                  <td>{entry.supplier?.name}</td>
                  <td>
                    {entry.supplier?.email}
                    {entry.supplier?.additional_emails && entry.supplier?.additional_emails.length > 0 && (
                      <span>, {entry.supplier.additional_emails.join(', ')}</span>
                    )}
                  </td>
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
