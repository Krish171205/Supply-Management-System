import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import './Pages.css';

function Profile({ user }) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updateData = {
        email: formData.email,
        phone: formData.phone
      };

      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        updateData.password = formData.password;
      }

      await authAPI.updateProfile(updateData);
      setSuccess('Profile updated successfully');
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Profile</h1>
        <button type="submit" form="profile-form" className="btn btn-primary" disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form id="profile-form" onSubmit={handleSubmit}>
        <div className="profile-grid">
          {/* Left Column: Personal Info */}
          <div className="profile-section">
            <h3>Profile Information</h3>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={user?.name}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                value={user?.role?.toUpperCase()}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Right Column: Security */}
          <div className="profile-section">
            <h3>Security Settings</h3>

            <div className="form-group">
              <label>New Password (leave blank to keep current)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Profile;
