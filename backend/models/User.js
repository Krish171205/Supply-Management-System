const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'supplier'
  },
  hashed_password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  }
  ,
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.hashed_password) {
        user.hashed_password = await bcrypt.hash(user.hashed_password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('hashed_password')) {
        user.hashed_password = await bcrypt.hash(user.hashed_password, 10);
      }
    }
  }
});

// Verify password method
User.prototype.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.hashed_password);
};

module.exports = User;
