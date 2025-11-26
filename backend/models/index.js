const User = require('./User');
const Ingredient = require('./Ingredient');
const SupplierCatalog = require('./SupplierCatalog');
const Inquiry = require('./Inquiry');
const Quotes = require('./Quotes');
const PasswordResetToken = require('./PasswordResetToken');

// Ingredients <-> SupplierCatalog <-> Users (suppliers)
Ingredient.hasMany(SupplierCatalog, { foreignKey: 'ingredient_id', onDelete: 'CASCADE' });
SupplierCatalog.belongsTo(Ingredient, { foreignKey: 'ingredient_id' });

User.hasMany(SupplierCatalog, { foreignKey: 'supplier_user_id', onDelete: 'CASCADE' });
SupplierCatalog.belongsTo(User, { foreignKey: 'supplier_user_id', as: 'supplier' });

// Inquiries
Ingredient.hasMany(Inquiry, { foreignKey: 'ingredient_id', onDelete: 'CASCADE' });
Inquiry.belongsTo(Ingredient, { foreignKey: 'ingredient_id' });

User.hasMany(Inquiry, { foreignKey: 'supplier_user_id', onDelete: 'CASCADE', as: 'incomingInquiries' });
Inquiry.belongsTo(User, { foreignKey: 'supplier_user_id', as: 'supplierUser' });

User.hasMany(Inquiry, { foreignKey: 'created_by', onDelete: 'CASCADE', as: 'createdInquiries' });
Inquiry.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Quotes (responses to inquiries)
Inquiry.hasMany(Quotes, { foreignKey: 'inquiry_id', onDelete: 'CASCADE' });
Quotes.belongsTo(Inquiry, { foreignKey: 'inquiry_id' });

Ingredient.hasMany(Quotes, { foreignKey: 'ingredient_id', onDelete: 'CASCADE' });
Quotes.belongsTo(Ingredient, { foreignKey: 'ingredient_id' });

User.hasMany(Quotes, { foreignKey: 'supplier_user_id', onDelete: 'CASCADE', as: 'suppliedQuotes' });
Quotes.belongsTo(User, { foreignKey: 'supplier_user_id', as: 'supplier' });

User.hasMany(Quotes, { foreignKey: 'responded_by', onDelete: 'SET NULL', as: 'respondedQuotes' });
Quotes.belongsTo(User, { foreignKey: 'responded_by', as: 'respondedByUser' });

User.hasMany(Quotes, { foreignKey: 'accepted_by', onDelete: 'SET NULL', as: 'acceptedQuotes' });
Quotes.belongsTo(User, { foreignKey: 'accepted_by', as: 'acceptedByUser' });

// Password reset tokens
User.hasMany(PasswordResetToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  User,
  Ingredient,
  SupplierCatalog,
  Inquiry,
  Quotes,
  PasswordResetToken
};
