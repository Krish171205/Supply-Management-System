const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', {
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
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Should be false ideally, but for migration safety
    references: {
      model: 'users',
      key: 'id'
    }
  },
  contact_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  payment_type: {
    type: DataTypes.ENUM('advance', 'credit'),
    allowNull: false,
    defaultValue: 'advance'
  }
}, {
  timestamps: false,
  createdAt: 'created_at',
  underscored: true,
  tableName: 'suppliers'
});

module.exports = Supplier;
