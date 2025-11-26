# Backend Setup Guide

## Prerequisites

- Node.js v14 or higher
- MySQL Server (or PostgreSQL with adjustments)
- npm

## Step-by-Step Setup

### 1. Install Node.js and npm

Download from https://nodejs.org/ and install the LTS version.

### 2. Create MySQL Database

Open MySQL command line or MySQL Workbench:

```sql
CREATE DATABASE supplier_db;
```

Or if you need to specify a user:

```sql
CREATE DATABASE supplier_db;
CREATE USER 'supplier_user'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON supplier_db.* TO 'supplier_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configure Environment Variables

Edit the `.env` file in the `backend` folder:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=supplier_db
DB_DIALECT=mysql
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_secret_key_change_this_in_production
JWT_EXPIRY=24h

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

**For different database setups:**

- **MySQL with password:**
  ```env
  DB_USER=supplier_user
  DB_PASSWORD=password123
  ```

- **PostgreSQL:**
  ```env
  DB_DIALECT=postgres
  DB_USER=postgres
  DB_PASSWORD=postgres
  DB_PORT=5432
  ```

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Seed Database (Optional - for testing)

```bash
npm run seed
```

This creates:
- 1 admin user (admin/admin123)
- 2 supplier users (supplier1/supplier123, supplier2/supplier123)
- 3 sample ingredients
- Sample inquiry data

### 6. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Testing

### Using cURL

**Login as admin:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Get all ingredients:**
```bash
curl http://localhost:5000/api/ingredients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. Import the collection below into Postman
2. Set the `token` variable to the JWT from login response
3. Run requests

## Database Tables

The system creates these tables:

- `users` - User accounts
- `suppliers` - Supplier profiles
- `ingredients` - Ingredient catalog
- `ingredient_suppliers` - Ingredient-supplier mappings
- `inquiries` - Inquiries from admins
- `inquiry_responses` - Supplier responses to inquiries
- `orders` - Orders placed

## Troubleshooting

### Database Connection Error
- Ensure MySQL server is running
- Check database name, user, and password in `.env`
- Verify MySQL port is 3306 (or update in `.env`)

### Port Already in Use
Change the PORT in `.env` to an available port (e.g., 5001)

### Permission Denied Errors
Make sure your MySQL user has proper privileges:
```sql
GRANT ALL PRIVILEGES ON supplier_db.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

## Next Steps

1. Test the API with provided credentials
2. Set up the React frontend
3. Configure HTTPS for production
4. Update JWT_SECRET to a strong value
5. Set up proper database backups

## Environment Variables Summary

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | Database host | localhost |
| DB_USER | Database user | root |
| DB_PASSWORD | Database password | (empty) |
| DB_NAME | Database name | supplier_db |
| DB_DIALECT | Database type | mysql |
| DB_PORT | Database port | 3306 |
| JWT_SECRET | JWT signing secret | your_secret_key... |
| JWT_EXPIRY | JWT expiration time | 24h |
| PORT | Server port | 5000 |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |
| NODE_ENV | Environment | development |
