// Empty seed file: no initial data

require('dotenv').config();
const sequelize = require('./config/database');
const {
  User,
  Ingredient,
  SupplierCatalog,
  Inquiry,
  Quotes
} = require('./models');

async function seedDatabase() {
  try {
    console.log('Syncing database (force: true)...');
    await sequelize.sync({ force: true });

    console.log('Creating test data...');

    // Create users (admin and suppliers)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@krisba.com',
      phone: '4155552600',
      role: 'admin',
      hashed_password: 'krisba@123',
      is_active: true
    });

    const supplierKrish = await User.create({
      name: 'krish',
      email: 'krishbavishi2005@gmail.com',
      phone: '9920081681',
      role: 'supplier',
      hashed_password: '1234',
      is_active: true
    });

    // Create Supplier profile for krish
    const { Supplier } = require('./models');
    await Supplier.create({
      user_id: supplierKrish.id,
      name: supplierKrish.name,
      contact_email: supplierKrish.email,
      phone: supplierKrish.phone,
      address: '123 Test St, Test City',
      payment_type: 'credit'
    });

    // Create ingredients
    const coffee = await Ingredient.create({
      name: 'Coffee',
      brands: ['Nescafe', 'Starbucks'],
      unit: 'L'
    });

    // Create supplier catalog entries
    await SupplierCatalog.create({
      ingredient_id: coffee.id,
      supplier_user_id: supplierKrish.id,
      price_hint: 50.0,
      available: true
    });

    console.log('✓ Database seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('Admin: Name="Admin User", password="krisba@123"');
    console.log('Supplier: Name="krish", Email="krishbavishi2005@gmail.com", password="1234"');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
