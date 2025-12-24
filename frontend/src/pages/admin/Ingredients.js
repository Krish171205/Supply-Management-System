import React, { useState, useEffect } from 'react';
import { ingredientsAPI } from '../../services/api';
import './Pages.css';

function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', brands: [] });
  const [newBrand, setNewBrand] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchIngredients();
  }, [search, page]);

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const response = await ingredientsAPI.getAll(search, page);
      setIngredients(response.data.ingredients);
      setPagination(response.data.pagination);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching ingredients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = (e) => {
    e.preventDefault();
    if (newBrand.trim()) {
      setFormData({
        ...formData,
        brands: [...formData.brands, newBrand.trim()]
      });
      setNewBrand('');
    }
  };

  const handleRemoveBrand = (index) => {
    const updatedBrands = formData.brands.filter((_, i) => i !== index);
    setFormData({ ...formData, brands: updatedBrands });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await ingredientsAPI.create(formData);
      setFormData({ name: '', brands: [] });
      setPage(1);
      await fetchIngredients();
      setShowForm(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating ingredient');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await ingredientsAPI.delete(id);
        fetchIngredients();
      } catch (err) {
        setError(err.response?.data?.message || 'Error deleting ingredient');
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Ingredients Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Ingredient'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleCreate}>
          <h3>Add New Ingredient</h3>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Brands</label>
            <div className="brand-input-group" style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Enter brand name"
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleAddBrand(e)}
              />
              <button type="button" className="btn btn-secondary" onClick={handleAddBrand}>Add</button>
            </div>
            <div className="brands-tags" style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {formData.brands.map((brand, index) => (
                <span key={index} className="tag" style={{ background: '#e0e0e0', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {brand}
                  <button type="button" onClick={() => handleRemoveBrand(index)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'red', fontWeight: 'bold' }}>×</button>
                </span>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading && <p className="loading">Loading...</p>}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Brands</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.length > 0 ? (
              ingredients.map((ingredient) => (
                <tr key={ingredient.id}>
                  <td>{ingredient.name}</td>
                  <td>
                    {ingredient.brands && ingredient.brands.length > 0
                      ? ingredient.brands.join(', ')
                      : <span className="text-muted">No brands</span>}
                  </td>
                  <td>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(ingredient.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="text-center">No ingredients found</td>
              </tr>
            )}
          </tbody>
        </table>
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

export default Ingredients;
