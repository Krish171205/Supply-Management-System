const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ingredient = sequelize.define('Ingredient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  brands: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  unit: {
    type: DataTypes.ENUM('L', 'kg', 'units', 'pieces'),
    allowNull: false,
    defaultValue: 'kg'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'ingredients'
});

module.exports = Ingredient;
