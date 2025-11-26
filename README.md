
# Supplier Management System

A full-stack web application for managing suppliers, ingredients, inquiries, quotes, and orders. Built with Node.js/Express backend and React frontend.

## Features

**Admin:**
- Manage ingredients and suppliers
- Send inquiries to suppliers for specific ingredients
- Track supplier responses and quotes
- Place orders from accepted quotes
- Monitor order status (pending, shipped, received)
- Create supplier accounts with auto-generated credentials

**Supplier:**
- View inquiries sent to them
- Submit price quotes
- Track and update their orders
- Complete and update profile information

## Project Structure

```
website/
├── backend/
│   ├── config/          # Database and email configuration
│   ├── middleware/      # Auth and authorization middleware
│   ├── models/          # Sequelize ORM models
│   ├── routes/          # API routes (auth, suppliers, ingredients, inquiries, quotes, orders)
│   ├── .env             # Environment variables
│   ├── package.json
│   ├── server.js        # Express server entry point
│   ├── seed.js          # Database seeder
│   ├── README.md
│   └── SETUP_GUIDE.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── supplier/
│   │   ├── services/    # API and Socket.IO clients
│   │   ├── App.js
│   │   └── index.js
│   ├── .env (optional)
│   ├── package.json
│   └── README.md
├── README.md
├── QUICKSTART.md
├── COMPLETE_SUMMARY.md
├── IMPLEMENTATION.md
├── PRODUCTION_READINESS_REPORT.md
```

## Technology Stack

**Backend:** Node.js, Express, Sequelize ORM, MySQL/PostgreSQL, JWT, bcrypt, Socket.IO
**Frontend:** React 18, React Router v6, Axios, Socket.IO Client, CSS

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for full setup instructions.

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=supplier_db
JWT_SECRET=your_secret_key
PORT=5000
```

4. Create database:
```sql
CREATE DATABASE supplier_db;
```

5. Seed test data (optional):
```bash
npm run seed
```

6. Start backend:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Setup Frontend

1. Open new terminal, navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

Frontend will open at `http://localhost:3000`

## Test Credentials

After seeding the database:

**Admin:**
- Name: `Admin User`
- Password: `krisba@123`

**Supplier 1:**
- Name: `ABC Supplies Ltd`
- Password: `supplier123`

**Supplier 2:**
- Name: `XYZ Trading Co`
- Password: `supplier123`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/create-supplier` - Create supplier (admin only)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Ingredients
- `GET /api/ingredients` - List ingredients with search
- `POST /api/ingredients` - Create ingredient (admin only)
- `GET /api/ingredients/:id` - Get ingredient details
- `PUT /api/ingredients/:id` - Update ingredient
- `DELETE /api/ingredients/:id` - Delete ingredient

### Suppliers
- `GET /api/suppliers` - List suppliers (admin only)
- `POST /api/suppliers` - Create supplier (admin only)
- `GET /api/suppliers/:id` - Get supplier details
- `PUT /api/suppliers/:id` - Update supplier
- `GET /api/suppliers/by-ingredient/:id` - Get suppliers for ingredient
- `POST /api/suppliers/:id/ingredients/:ingId` - Link ingredient to supplier

### Inquiries
- `POST /api/inquiries` - Create inquiry (admin only)
- `GET /api/inquiries/admin/all` - Get admin's inquiries
- `GET /api/inquiries/supplier/pending` - Get pending inquiries for supplier
- `GET /api/inquiries/:id` - Get inquiry with responses
- `GET /api/inquiries/:id/responses` - Get all responses for inquiry
- `POST /api/inquiries/:id/respond` - Submit quote (supplier only)
- `PUT /api/inquiries/:id/responses/:responseId` - Update response status

### Orders
- `POST /api/orders` - Create order from response (admin only)
- `GET /api/orders/admin/all` - Get admin's orders
- `GET /api/orders/supplier/all` - Get supplier's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order status

## Features

### Core Features
✅ User authentication with JWT
✅ Role-based access control (Admin/Supplier)
✅ Ingredient management
✅ Supplier management
✅ Inquiry creation and tracking
✅ Quote submission by suppliers
✅ Order management
✅ Order status tracking
✅ Real-time updates via WebSocket
✅ Password hashing with bcrypt
✅ Profile management

### Admin Features
- Create and manage ingredients
- Add and manage suppliers
- Send inquiries to multiple suppliers
- Track supplier responses
- Create orders from accepted quotes
- Update order status

### Supplier Features
- View pending inquiries
- Submit quotes with pricing
- Complete profile (email, phone required before responding)
- View orders
- Update order status (pending → shipped → received)
- Change password

## Database Schema

### Users
- id, username, email, phone, password, role, profileComplete

### Suppliers
- id, userId (FK), companyName, address, city, state, zipCode, country, taxId

### Ingredients
- id, name, description, unit

### IngredientSuppliers
- id, ingredientId (FK), supplierId (FK)

### Inquiries
- id, ingredientId (FK), adminId (FK), quantity, status

### InquiryResponses
- id, inquiryId (FK), supplierId (FK), quotedPrice, status, respondedAt

### Orders
- id, inquiryResponseId (FK), supplierId (FK), adminId (FK), quantity, price, status, shippedDate, arrivedDate

## Security Considerations

- Passwords are hashed using bcrypt with salt rounds
- JWT tokens for stateless authentication
- Role-based authorization on backend
- CORS configured for frontend origin
- Environment variables for sensitive data
- SQL injection prevention via Sequelize ORM

**Note**: For production, implement:
- HTTPS/TLS encryption
- Rate limiting
- Input validation
- CSRF tokens if using cookies
- Security headers (HSTS, CSP, etc.)
- Regular security audits

## Development Notes

### Running in Development
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Database Seeding
The `seed.js` file creates test data:
- 1 admin user
- 2 supplier users
- 3 sample ingredients
- Ingredient-supplier links
- Sample inquiry

Run with:
```bash
npm run seed
```

### Real-time Events
Socket.IO events emitted:
- `inquiryCreated` - New inquiry sent
- `inquiryResponded` - Supplier submitted quote
- `orderCreated` - Order created from quote
- `orderUpdated` - Order status changed

## Troubleshooting

### Backend Issues

**Database connection error:**
- Ensure MySQL is running
- Check DB credentials in `.env`
- Verify database exists

**Port already in use:**
- Change PORT in `.env` or kill process using port 5000

**Module not found:**
- Run `npm install` in backend folder

### Frontend Issues

**Can't connect to backend:**
- Ensure backend is running on port 5000
- Check `REACT_APP_API_URL` in `.env` or backend cors config
- Check browser console for CORS errors

**Login not working:**
- Verify test data was created with `npm run seed`
- Check backend is running
- Try clearing browser localStorage

**Real-time updates not working:**
- Check WebSocket connection in browser DevTools
- Verify Socket.IO server is enabled on backend
- Check for firewall blocking WebSocket

## Future Enhancements

- Email notifications for inquiries and orders
- Advanced search and filtering
- Bulk operations
- Supplier ratings and reviews
- Order history and analytics
- Delivery tracking integration
- Multi-currency support
- Document/contract management
- API documentation (Swagger)
- Unit and integration tests

## License

This project is provided as-is for internal use.

## Support

For issues or questions, refer to the individual README files in `backend/` and `frontend/` directories.
