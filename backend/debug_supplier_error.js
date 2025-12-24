const sequelize = require('./config/database');
const { User, Supplier, Quotes } = require('./models');
require('dotenv').config();

async function debugSupplierError() {
    try {
        console.log('--- Starting Debug ---');

        // 1. Fetch all Quotes to find a recent one
        const recentQuote = await Quotes.findOne({
            order: [['id', 'DESC']]
        });

        if (!recentQuote) {
            console.log('No quotes found in DB.');
            return;
        }

        console.log(`Recent Quote ID: ${recentQuote.id}`);
        console.log(`Quote Supplier User ID: ${recentQuote.supplier_user_id}`);

        // 2. Check User
        const user = await User.findByPk(recentQuote.supplier_user_id);
        if (!user) {
            console.error(`CRITICAL: User with ID ${recentQuote.supplier_user_id} NOT FOUND in Users table!`);
        } else {
            console.log(`User Found: ID=${user.id}, Name=${user.name}, Role=${user.role}`);
        }

        // 3. Check Supplier
        const supplier = await Supplier.findOne({ where: { user_id: recentQuote.supplier_user_id } });
        if (!supplier) {
            console.log(`Supplier Profile NOT FOUND for User ID ${recentQuote.supplier_user_id}`);

            // Simulate Creation
            if (user) {
                console.log('Attempting to simulate creation...');
                try {
                    const newSupplier = await Supplier.create({
                        user_id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: 'N/A',
                        address: 'N/A'
                    });
                    console.log(`SUCCESS: Created Supplier Profile ID=${newSupplier.id}`);
                    // Clean up test creation
                    await newSupplier.destroy();
                    console.log('Cleaned up test supplier.');
                } catch (err) {
                    console.error('ERROR creating supplier:', err.message);
                }
            }
        } else {
            console.log(`Supplier Profile Found: ID=${supplier.id}, Name=${supplier.name}`);
        }

    } catch (error) {
        console.error('Debug Script Error:', error);
    }
}

debugSupplierError();
