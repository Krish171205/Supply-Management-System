
# Quick Start Guide

Get the Supplier Management System up and running quickly.

## Prerequisites

- Node.js v14+ installed
- MySQL Server running (or PostgreSQL)
- npm package manager

## 1. Database Setup

Create the database:
```bash
mysql -u root
CREATE DATABASE supplier_db;
exit;
```

Or use MySQL Workbench to create a schema named `supplier_db`.

## 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder with your database and JWT credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=supplier_db
DB_DIALECT=mysql
DB_PORT=3306
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRY=24h
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Seed test data (optional):
```bash
npm run seed
```

Start backend server:
```bash
npm run dev
```

## 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend will open at `http://localhost:3000`.

## 4. Test Credentials

- Admin: name=`Admin User`, password=`krisba@123`
- Supplier 1: name=`ABC Supplies Ltd`, password=`supplier123`
- Supplier 2: name=`XYZ Trading Co`, password=`supplier123`

Expected output:
```
Server is running on port 5000
```

Test API: Open browser to `http://localhost:5000/api/health`
Expected response: `{"status":"API is running"}`

## Step 3: Frontend Setup

Open new terminal:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Browser will automatically open to `http://localhost:3000`

## Step 4: Test the Application

### Test Admin Account
1. Go to `http://localhost:3000`
2. Click "Login"
3. Enter:
   - Name: `Admin User`
   - Password: `krisba@123`
4. Click "Login"

You should see the Admin Dashboard.

### Test Supplier Account
1. Logout from admin
2. Go to `http://localhost:3000/login`
3. Enter:
   - Name: `ABC Supplies Ltd`
   - Password: `supplier123`
4. Click "Login"

You should see the Supplier Dashboard.

## Workflows to Test

### Admin Workflow
1. **Ingredients** tab: View/add ingredients
2. **Suppliers** tab: View suppliers
3. **Inquiries** tab: 
   - Click "+ Send Inquiry"
   - Select an ingredient
   - Check suppliers
   - Click "Send"
4. **Orders** tab: View orders (after supplier quotes)
5. **Profile** tab: Update profile

### Supplier Workflow
1. **Pending Inquiries** tab: View inquiries sent to you
2. Fill in price and click "Submit"
3. **My Orders** tab: View orders
4. **Profile** tab: 
   - Complete email and phone (required!)
   - Add company details
   - Update password

## API Testing with cURL or Postman

### Login and Get Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Use Token for Authenticated Requests
```bash
curl http://localhost:5000/api/ingredients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### Database Connection Error
```
Error: Access denied for user 'root'@'localhost'
```

**Solution:**
- Ensure MySQL is running
- Check DB credentials in `.env`
- Update `.env` with correct password if you set one during MySQL installation

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
- Change PORT in `.env` to 5001, 5002, etc.
- Or kill process: `netstat -ano | findstr :5000` (Windows) then `taskkill /PID <PID> /F`

### Frontend Can't Connect to Backend
- Ensure backend is running on port 5000
- Check console errors in browser DevTools
- Try clearing browser cache and localhost storage

### Test Data Not Showing
```bash
# Re-run seed script
npm run seed

# This will recreate all test data
```

## File Locations

| File | Purpose |
|------|---------|
| `backend/.env` | Database & JWT configuration |
| `backend/seed.js` | Test data creation |
| `backend/server.js` | Express server entry point |
| `frontend/src/App.js` | React app entry point |
| `website/README.md` | Full documentation |
| `backend/README.md` | API documentation |
| `backend/SETUP_GUIDE.md` | Detailed setup steps |

## Common Commands

```bash
# Backend
cd backend
npm install          # Install dependencies
npm run dev         # Start with auto-reload
npm start           # Start normally
npm run seed        # Create test data

# Frontend
cd frontend
npm install         # Install dependencies
npm start           # Start dev server
npm run build       # Create production build
```

## Next Steps

1. ✅ **Backend running** on http://localhost:5000
2. ✅ **Frontend running** on http://localhost:3000
3. ✅ **Database connected** with test data
4. 📝 **Test workflows** with provided credentials
5. 🚀 **Customize** as needed for your use case

## Features to Try

### Admin
- [ ] Add new ingredient
- [ ] Create new supplier account (auto-generated credentials)
- [ ] Send inquiry to suppliers
- [ ] View supplier quotes
- [ ] Create order from quote
- [ ] Update order status

### Supplier
- [ ] Complete profile (email, phone)
- [ ] Submit quote to inquiry
- [ ] View orders
- [ ] Update order status (ship/receive)
- [ ] Change password

## Stop Services

Press `Ctrl+C` in terminal windows to stop:
- Backend server
- Frontend dev server

## Reset Database

```bash
# Drop and recreate database
mysql -u root
DROP DATABASE supplier_db;
CREATE DATABASE supplier_db;
exit;

# Reseed data
cd backend
npm run seed
```

## Getting Help

- Check individual README files:
  - `backend/README.md` - API details
  - `frontend/README.md` - UI details
  - `website/README.md` - Full overview
  
- Check `SETUP_GUIDE.md` for detailed setup steps

- Check browser Console (F12) for frontend errors

- Check terminal output for backend errors

---

**You're all set! Happy testing! 🎉**
