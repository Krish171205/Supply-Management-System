const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupplierCatalog = sequelize.define('SupplierCatalog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ingredient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ingredients',
      key: 'id'
    }
  },
  supplier_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  price_hint: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
  ,
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'supplier_catalog',
  indexes: [
    {
      unique: true,
      fields: ['ingredient_id', 'supplier_user_id']
    }
  ]
});

module.exports = SupplierCatalog;
