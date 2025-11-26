import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f4f7f6',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '96px', margin: '0' }}>404</h1>
      <h2 style={{ marginTop: '10px' }}>Page Not Found</h2>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginTop: '30px',
          padding: '12px 30px',
          background: 'white',
          color: '#3C6E69',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '16px'
        }}
      >
        Go Back
      </button>
    </div>
  );
}

export default NotFound;
