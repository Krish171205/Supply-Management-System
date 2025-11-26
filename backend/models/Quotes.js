const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quotes = sequelize.define('Quotes', {
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
  price: {
    type: DataTypes.DECIMAL(18, 4),
    allowNull: false
  },
  accepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  amt: {
    type: DataTypes.DECIMAL(18, 4),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'quoted',
    allowNull: false
  },
  responded_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  responded_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  accepted_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  accepted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  placed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  shipped_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  received_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'quotes',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Quotes;
