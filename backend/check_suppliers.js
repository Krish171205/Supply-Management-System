const sequelize = require('./config/database');
const { User, Supplier } = require('./models');
require('dotenv').config();

async function checkData() {
    try {
        const users = await User.findAll({ where: { role: 'supplier' } });
        console.log('Supplier Users:', users.map(u => ({ id: u.id, name: u.name, email: u.email })));

        const suppliers = await Supplier.findAll();
        console.log('Supplier Profiles:', suppliers.map(s => ({ id: s.id, user_id: s.user_id, name: s.name })));

        // Check for mismatches
        for (const user of users) {
            const profile = suppliers.find(s => s.user_id === user.id);
            if (!profile) {
                console.log(`WARNING: User ${user.name} (ID: ${user.id}) has NO Supplier profile.`);
            } else {
                console.log(`OK: User ${user.name} (ID: ${user.id}) linked to Supplier ${profile.id}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkData();
