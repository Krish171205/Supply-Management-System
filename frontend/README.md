# Supplier Management System - Frontend

A React-based web application for managing supplier interactions, inquiries, and orders.

## Features

- User authentication (Admin & Supplier roles)
- Real-time updates via WebSocket
- Admin dashboard for:
  - Ingredient management
  - Supplier management
  - Inquiry creation and tracking
  - Order management
- Supplier dashboard for:
  - Viewing pending inquiries
  - Submitting quotes
  - Managing orders
  - Profile completion

## Prerequisites

- Node.js v14 or higher
- npm
- Backend API running on http://localhost:5000

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional, if backend is not on default localhost:5000):
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Running the Application

**Development mode:**
```bash
npm start
```

The app will open at `http://localhost:3000`

**Production build:**
```bash
npm run build
```

## Project Structure

```
src/
├── pages/
│   ├── Login.js
│   ├── Signup.js
│   ├── NotFound.js
│   ├── admin/
│   │   ├── AdminDashboard.js
│   │   ├── Ingredients.js
│   │   ├── Suppliers.js
│   │   ├── Inquiries.js
│   │   ├── Orders.js
│   │   ├── Profile.js
│   │   └── Dashboard.css
│   └── supplier/
│       ├── SupplierDashboard.js
│       ├── PendingInquiries.js
│       ├── SupplierOrders.js
│       └── SupplierProfile.js
├── services/
│   ├── api.js (API client)
│   └── socket.js (WebSocket client)
├── App.js
├── App.css
└── index.js
```

## API Integration

The frontend communicates with the backend API via the `services/api.js` module. All endpoints require JWT authentication except for login/signup.

### Base URL
- Development: `http://localhost:5000/api`
- Can be configured via `REACT_APP_API_URL` environment variable

## Authentication

1. User logs in via `/login` page
2. JWT token is stored in localStorage
3. Token is automatically included in all API requests
4. If token expires, user is redirected to login

## Real-time Updates

The frontend uses Socket.IO to receive real-time updates for:
- New inquiries
- Supplier responses
- Order updates

## User Roles & Features

### Admin
- Create/edit ingredients
- Manage suppliers
- Send inquiries to suppliers
- View supplier responses
- Create and track orders

### Supplier
- View inquiries sent to them
- Submit price quotes (after completing profile)
- View and update order status
- Complete profile information (email, phone required)

## Default Test Credentials

After running the backend seed script:

| Role | Username | Password |
|------|----------|----------|
| Admin | Admin User | krisba@123 |
| Supplier | ABC Supplies Ltd | supplier123 |
| Supplier | XYZ Trading Co | supplier123 |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | http://localhost:5000/api |
| REACT_APP_SOCKET_URL | WebSocket server URL | http://localhost:5000 |

## Build and Deploy

### Build for production:
```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

### Deploy options:
1. **Netlify**: Connect your GitHub repo to Netlify for automatic deployments
2. **Vercel**: Push to GitHub and deploy via Vercel
3. **Express static serving**: Build and serve from backend Express server

## Troubleshooting

### API connection errors
- Ensure backend is running on http://localhost:5000
- Check CORS configuration in backend
- Verify `.env` file has correct `REACT_APP_API_URL`

### Login/Authentication issues
- Clear browser localStorage
- Check that backend database has test data (run seed script)
- Verify JWT token format

### Real-time updates not working
- Check WebSocket connection in browser DevTools
- Ensure Socket.IO is enabled on backend
- Verify firewall allows WebSocket connections

## Development Notes

- React Router v6 is used for client-side routing
- Axios is used for API calls with interceptors for token management
- CSS modules are not used; component-level CSS files are provided
- Responsive design implemented for mobile devices
