# Supplier Management System - Backend API

A RESTful API built with Node.js and Express for managing suppliers, ingredients, inquiries, and orders.

## Features

- **Authentication**: JWT-based authentication with role-based access control (Admin/Supplier)
- **Ingredient Management**: CRUD operations for ingredients
- **Supplier Management**: Manage supplier profiles and link them to ingredients
- **Inquiry System**: Create and track inquiries sent to suppliers
- **Order Management**: Process orders from accepted quotes
- **Real-time Updates**: WebSocket support for live notifications
- **Password Security**: Bcrypt hashing for secure password storage

## Prerequisites

- Node.js (v14 or higher)
- MySQL/PostgreSQL database
- npm

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=supplier_db
DB_DIALECT=mysql
DB_PORT=3306

JWT_SECRET=your_secret_key_change_this_in_production
JWT_EXPIRY=24h

PORT=5000
FRONTEND_URL=http://localhost:3000

NODE_ENV=development
```

3. Create the database:
```sql
CREATE DATABASE supplier_db;
```

4. Start the server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication (`/api/auth`)

- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/create-supplier` - Create supplier account (Admin only)
- `GET /auth/me` - Get current user profile
- `PUT /auth/profile` - Update user profile

### Ingredients (`/api/ingredients`)

- `GET /` - Get all ingredients with pagination and search
- `GET /:id` - Get single ingredient with suppliers
- `GET /:id/suppliers` - Get suppliers for an ingredient
- `POST /` - Create ingredient (Admin only)
- `PUT /:id` - Update ingredient (Admin only)
- `DELETE /:id` - Delete ingredient (Admin only)

### Suppliers (`/api/suppliers`)

- `GET /` - Get all suppliers (Admin only)
- `GET /by-ingredient/:ingredientId` - Get suppliers by ingredient (Admin only)
- `GET /profile/me` - Get supplier's own profile (Supplier only)
- `GET /:id` - Get single supplier (Admin only)
- `POST /` - Create supplier (Admin only)
- `PUT /:id` - Update supplier profile
- `POST /:supplierId/ingredients/:ingredientId` - Add ingredient to supplier (Admin only)
- `DELETE /:supplierId/ingredients/:ingredientId` - Remove ingredient from supplier (Admin only)

### Inquiries (`/api/inquiries`)

- `POST /` - Create inquiry (Admin only)
- `GET /admin/all` - Get all inquiries for admin
- `GET /supplier/pending` - Get pending inquiries for supplier
- `GET /:id` - Get single inquiry with responses
- `GET /:inquiryId/responses` - Get responses for inquiry
- `POST /:inquiryId/respond` - Submit quote (Supplier only)
- `PUT /:inquiryId/responses/:responseId` - Update response status (Admin only)

### Orders (`/api/orders`)

- `POST /` - Create order from inquiry response (Admin only)
- `GET /admin/all` - Get all orders for admin
- `GET /supplier/all` - Get all orders for supplier
- `GET /:id` - Get single order
- `PUT /:id` - Update order status

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

The token is returned on login/signup and should be stored on the client side.

## User Roles

### Admin
- Create/manage ingredients and suppliers
- Send inquiries to suppliers
- View all supplier responses
- Create and track orders
- Update order status

### Supplier
- View inquiries sent to them
- Submit quotes for inquiries
- Complete profile (email, phone) before responding
- View their orders
- Update order status (pending → shipped → received)

## Database Schema

### Tables
- `users` - User accounts (admin/supplier)
- `suppliers` - Supplier profiles linked to users
- `ingredients` - Ingredient catalog
- `ingredient_suppliers` - Many-to-many relationship between ingredients and suppliers
- `inquiries` - Inquiries sent by admins
- `inquiry_responses` - Supplier responses to inquiries
- `orders` - Orders created from accepted quotes

## Real-time Events (WebSocket)

The API emits real-time events for:
- `inquiryCreated` - When a new inquiry is created
- `inquiryResponded` - When a supplier submits a quote
- `orderCreated` - When an order is created
- `orderUpdated` - When an order status changes

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Development

To run with hot reload:
```bash
npm run dev
```

To run normally:
```bash
npm start
```

## Notes

- Password security: Currently using bcrypt without OWASP constraints. Consider adding password complexity requirements in production.
- Database: Uses Sequelize ORM for MySQL compatibility. Update `config/database.js` for different databases.
- CORS: Configured for frontend running on `http://localhost:3000`. Update in production.
