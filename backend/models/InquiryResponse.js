const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InquiryResponse = sequelize.define('InquiryResponse', {
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
  quote_price: {
    type: DataTypes.DECIMAL(12,2),
    allowNull: true
  },
  min_lead_days: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  responded_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responded_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: false,
  underscored: true,
  tableName: 'inquiry_responses'
});

module.exports = InquiryResponse;
