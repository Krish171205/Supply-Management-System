const { User, Supplier } = require('./models');
const sequelize = require('./config/database');

async function checkData() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const userId = 2;

        const user = await User.findByPk(userId);
        console.log(`User ${userId}:`, user ? user.toJSON() : 'Not Found');

        if (user) {
            const supplier = await Supplier.findOne({ where: { user_id: userId } });
            console.log(`Supplier profile for User ${userId}:`, supplier ? supplier.toJSON() : 'Not Found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkData();
