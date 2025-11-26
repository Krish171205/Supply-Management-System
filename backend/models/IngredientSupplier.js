const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IngredientSupplier = sequelize.define('IngredientSupplier', {
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
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'suppliers',
      key: 'id'
    }
  },
  catalog_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price_hint: {
    type: DataTypes.DECIMAL(12,2),
    allowNull: true
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: false,
  createdAt: 'created_at',
  underscored: true,
  tableName: 'ingredient_supplier',
  indexes: [
    {
      unique: true,
      fields: ['ingredient_id', 'supplier_id']
    }
  ]
});

module.exports = IngredientSupplier;
