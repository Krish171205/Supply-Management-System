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

    const supplier1 = await User.create({
      name: 'ABC Supplies Ltd',
      email: 'contact@abcsupplies.com',
      phone: '4155552601',
      role: 'supplier',
      hashed_password: 'supplier123',
      is_active: true
    });

    const supplier2 = await User.create({
      name: 'XYZ Trading Co',
      email: 'info@xyztrading.com',
      phone: '4155552602',
      role: 'supplier',
      hashed_password: 'supplier123',
      is_active: true
    });

    // Create ingredients
    const ingredient1 = await Ingredient.create({ name: 'Wheat Flour' });
    const ingredient2 = await Ingredient.create({ name: 'Sugar' });
    const ingredient3 = await Ingredient.create({ name: 'Salt' });

    // Create supplier catalog entries
    const catalogEntry1 = await SupplierCatalog.create({
      ingredient_id: ingredient1.id,
      supplier_user_id: supplier1.id,
      price_hint: 40.5,
      available: true
    });

    const catalogEntry2 = await SupplierCatalog.create({
      ingredient_id: ingredient1.id,
      supplier_user_id: supplier2.id,
      price_hint: 42.0,
      available: true
    });

    const catalogEntry3 = await SupplierCatalog.create({
      ingredient_id: ingredient2.id,
      supplier_user_id: supplier1.id,
      price_hint: 25.0,
      available: true
    });

    // Create a sample inquiry
    const inquiry = await Inquiry.create({
      ingredient_id: ingredient1.id,
      supplier_user_id: supplier1.id,
      created_by: admin.id,
      notes: 'Need 1000 kg of wheat flour',
      status: 'open'
    });

    // Create a quote (supplier responds)
    const quote = await Quotes.create({
      inquiry_id: inquiry.id,
      ingredient_id: ingredient1.id,
      supplier_user_id: supplier1.id,
      price: 41.0,
      accepted: false,
      status: 'quoted',
      responded_by: supplier1.id,
      responded_at: new Date()
    });

    console.log('✓ Database seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('Admin: Name="Admin User", password="krisba@123"');
    console.log('Supplier 1: Name="ABC Supplies Ltd", password="supplier123"');
    console.log('Supplier 2: Name="XYZ Trading Co", password="supplier123"');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
