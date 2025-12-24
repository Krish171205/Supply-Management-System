const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InquiryItem = sequelize.define('InquiryItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    quantity: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    brands: {
        type: DataTypes.JSON, // Array of strings
        allowNull: true
    }
}, {
    tableName: 'inquiry_items',
    timestamps: true
});

module.exports = InquiryItem;
