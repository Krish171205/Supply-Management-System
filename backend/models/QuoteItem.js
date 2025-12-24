const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuoteItem = sequelize.define('QuoteItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    brand_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: true // Null if is_nil is true
    },
    is_nil: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'quote_items',
    timestamps: true
});

module.exports = QuoteItem;
