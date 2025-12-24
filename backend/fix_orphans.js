const { User, Supplier } = require('./models');
const sequelize = require('./config/database');
require('dotenv').config();

async function fixOrphanSuppliers() {
    try {
        console.log('--- Starting Migration: Fix Orphan Suppliers ---');

        // 1. Get all users with role 'supplier'
        const supplierUsers = await User.findAll({ where: { role: 'supplier' } });
        console.log(`Found ${supplierUsers.length} supplier users.`);

        for (const user of supplierUsers) {
            // 2. Check if Supplier record exists
            const existingProfile = await Supplier.findOne({ where: { user_id: user.id } });

            if (!existingProfile) {
                console.log(`[FIX] Creating missing profile for User ID ${user.id} (${user.name})`);
                try {
                    await Supplier.create({
                        user_id: user.id,
                        name: user.name,
                        contact_email: user.email,
                        phone: user.phone || 'N/A',
                        address: 'N/A'
                    });
                    console.log(`[SUCCESS] Profile created.`);
                } catch (err) {
                    console.error(`[ERROR] Failed to create profile for User ID ${user.id}:`, err.message);
                }
            } else {
                console.log(`[OK] Profile exists for User ID ${user.id}`);
            }
        }

        console.log('--- Migration Complete ---');
    } catch (error) {
        console.error('Migration Error:', error);
    }
}

fixOrphanSuppliers();
