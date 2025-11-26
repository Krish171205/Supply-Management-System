const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InquiryTarget = sequelize.define('InquiryTarget', {
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
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  viewed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: false,
  underscored: true,
  tableName: 'inquiry_targets'
});

module.exports = InquiryTarget;
