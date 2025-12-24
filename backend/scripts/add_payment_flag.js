
require('dotenv').config({ path: '../.env' });
const sequelize = require('../config/database');
const { Supplier } = require('../models');

async function migrate() {
    try {
        console.log('Syncing Supplier model (alter: true)...');
        await Supplier.sync({ alter: true });
        console.log('Sync successful.');

        // Safety check: Update any existing suppliers to have a default value if null
        // (Though defaultValue in model handles new ones, existing ones might need it)
        await sequelize.query(`UPDATE suppliers SET payment_type = 'advance' WHERE payment_type IS NULL`);
        console.log('Updated existing records.');

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
