const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  inquiry_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'inquiries',
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
  inquiry_response_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'inquiry_responses',
      key: 'id'
    }
  },
  order_price: {
    type: DataTypes.DECIMAL(12,2),
    allowNull: true
  },
  quantity: {
    type: DataTypes.DECIMAL(12,2),
    allowNull: true
  },
  placed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expected_arrival: {
    type: DataTypes.DATE,
    allowNull: true
  },
  arrived_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tracking_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: false,
  createdAt: 'created_at',
  underscored: true,
  tableName: 'orders'
});

module.exports = Order;
