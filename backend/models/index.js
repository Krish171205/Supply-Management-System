const User = require('./User');
const Ingredient = require('./Ingredient');
const SupplierCatalog = require('./SupplierCatalog');
const Inquiry = require('./Inquiry');
const InquiryItem = require('./InquiryItem');
const Quotes = require('./Quotes');
const QuoteItem = require('./QuoteItem');
const PasswordResetToken = require('./PasswordResetToken');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Supplier = require('./Supplier');
const InquiryResponse = require('./InquiryResponse'); // Keeping for legacy or if needed, but likely deprecated

// Ingredients <-> SupplierCatalog <-> Users (suppliers)
Ingredient.hasMany(SupplierCatalog, { foreignKey: 'ingredient_id', onDelete: 'CASCADE' });
SupplierCatalog.belongsTo(Ingredient, { foreignKey: 'ingredient_id' });

User.hasMany(SupplierCatalog, { foreignKey: 'supplier_user_id', onDelete: 'CASCADE' });
SupplierCatalog.belongsTo(User, { foreignKey: 'supplier_user_id', as: 'supplier' });

// Inquiries
User.hasMany(Inquiry, { foreignKey: 'supplier_user_id', onDelete: 'CASCADE', as: 'incomingInquiries' });
Inquiry.belongsTo(User, { foreignKey: 'supplier_user_id', as: 'supplierUser' });

User.hasMany(Inquiry, { foreignKey: 'created_by', onDelete: 'CASCADE', as: 'createdInquiries' });
Inquiry.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Inquiry Items
Inquiry.hasMany(InquiryItem, { foreignKey: 'inquiry_id', onDelete: 'CASCADE' });
InquiryItem.belongsTo(Inquiry, { foreignKey: 'inquiry_id' });

Ingredient.hasMany(InquiryItem, { foreignKey: 'ingredient_id' });
InquiryItem.belongsTo(Ingredient, { foreignKey: 'ingredient_id' });

// Quotes
Inquiry.hasMany(Quotes, { foreignKey: 'inquiry_id', onDelete: 'CASCADE' });
Quotes.belongsTo(Inquiry, { foreignKey: 'inquiry_id' });

User.hasMany(Quotes, { foreignKey: 'supplier_user_id', onDelete: 'CASCADE', as: 'suppliedQuotes' });
Quotes.belongsTo(User, { foreignKey: 'supplier_user_id', as: 'supplier' });

User.hasMany(Quotes, { foreignKey: 'responded_by', onDelete: 'SET NULL', as: 'respondedQuotes' });
Quotes.belongsTo(User, { foreignKey: 'responded_by', as: 'respondedByUser' });

User.hasMany(Quotes, { foreignKey: 'accepted_by', onDelete: 'SET NULL', as: 'acceptedQuotes' });
Quotes.belongsTo(User, { foreignKey: 'accepted_by', as: 'acceptedByUser' });

// Quote Items
Quotes.hasMany(QuoteItem, { foreignKey: 'quote_id', onDelete: 'CASCADE' });
QuoteItem.belongsTo(Quotes, { foreignKey: 'quote_id' });

InquiryItem.hasMany(QuoteItem, { foreignKey: 'inquiry_item_id' });
QuoteItem.belongsTo(InquiryItem, { foreignKey: 'inquiry_item_id' });

// Orders
Order.belongsTo(Quotes, { foreignKey: 'quote_id' });
Quotes.hasOne(Order, { foreignKey: 'quote_id' });

Order.belongsTo(Supplier, { foreignKey: 'supplier_id' });
Supplier.hasMany(Order, { foreignKey: 'supplier_id' });

Order.belongsTo(User, { foreignKey: 'created_by', as: 'admin' });
User.hasMany(Order, { foreignKey: 'created_by', as: 'createdOrders' });

// Order Items
Order.hasMany(OrderItem, { foreignKey: 'order_id', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

QuoteItem.hasMany(OrderItem, { foreignKey: 'quote_item_id' });
OrderItem.belongsTo(QuoteItem, { foreignKey: 'quote_item_id' });

// Password reset tokens
User.hasMany(PasswordResetToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id' });

// Supplier associations
Supplier.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(Supplier, { foreignKey: 'user_id', as: 'supplierProfile' });

module.exports = {
  User,
  Ingredient,
  SupplierCatalog,
  Inquiry,
  InquiryItem,
  Quotes,
  QuoteItem,
  PasswordResetToken,
  Order,
  OrderItem,
  Supplier,
  InquiryResponse
};
