const express = require('express');
const { Quotes, QuoteItem, Inquiry, InquiryItem, User, Ingredient, Order, OrderItem } = require('../models');
const authMiddleware = require('../middleware/auth');
const { adminOnly, supplierOnly } = require('../middleware/authorization');
const { Op } = require('sequelize');

const router = express.Router();

// Create quote (Supplier responds to Inquiry)
router.post('/', authMiddleware, supplierOnly, async (req, res) => {
  try {
    const { inquiry_id, items } = req.body;
    // items: [{ inquiry_item_id, brand_name, price, is_nil }, ...]

    if (!inquiry_id || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'inquiry_id and items array are required' });
    }

    const inquiry = await Inquiry.findByPk(inquiry_id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    if (inquiry.supplier_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: This inquiry is not for you' });
    }

    // Check if quote already exists
    const existingQuote = await Quotes.findOne({ where: { inquiry_id } });
    if (existingQuote) {
      return res.status(400).json({ message: 'Quote already submitted for this inquiry' });
    }

    // Create Quote Header
    const quote = await Quotes.create({
      inquiry_id,
      supplier_user_id: req.user.id,
      status: 'quoted',
      responded_by: req.user.id,
      responded_at: new Date()
    });

    // Create Quote Items
    const quoteItemsData = items.map(item => ({
      quote_id: quote.id,
      inquiry_item_id: item.inquiry_item_id,
      brand_name: item.brand_name,
      price: item.is_nil ? null : item.price,
      is_nil: item.is_nil || false
    }));

    await QuoteItem.bulkCreate(quoteItemsData);

    // Update Inquiry status
    inquiry.status = 'responded';
    await inquiry.save();

    res.status(201).json({ message: 'Quote submitted', data: quote });

  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ message: 'Error creating quote', error: error.message });
  }
});

// Get all quotes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let where = {};

    if (req.user.role === 'supplier') {
      where.supplier_user_id = req.user.id;
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = end;
      }
    }

    const quotes = await Quotes.findAll({
      where,
      include: [
        {
          model: QuoteItem,
          include: [{
            model: InquiryItem,
            include: [{ model: Ingredient, attributes: ['id', 'name', 'unit'] }]
          }]
        },
        { model: Inquiry, attributes: ['id', 'notes'] },
        { model: User, as: 'supplier', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'respondedByUser', attributes: ['id', 'name', 'email'] }
      ],
      order: [['id', 'DESC']]
    });

    res.json({ message: 'Quotes retrieved', data: quotes });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ message: 'Error fetching quotes', error: error.message });
  }
});

// Get single quote
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const quote = await Quotes.findByPk(id, {
      include: [
        {
          model: QuoteItem,
          include: [{
            model: InquiryItem,
            include: [{ model: Ingredient, attributes: ['id', 'name', 'unit'] }]
          }]
        },
        { model: Inquiry, attributes: ['id', 'notes'] },
        { model: User, as: 'supplier', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    if (req.user.role === 'supplier' && quote.supplier_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json({ message: 'Quote retrieved', data: quote });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quote', error: error.message });
  }
});

// Accept Quote (Place Order)
router.put('/:id/accept', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { selected_items } = req.body;
    // selected_items: [quote_item_id_1, quote_item_id_2, ...]

    if (!selected_items || !Array.isArray(selected_items) || selected_items.length === 0) {
      return res.status(400).json({ message: 'No items selected for order' });
    }

    const quote = await Quotes.findByPk(id, {
      include: [
        {
          model: QuoteItem,
          include: [{
            model: InquiryItem,
            include: [{ model: Ingredient }]
          }]
        }
      ]
    });

    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    // Find Supplier ID from user_id
    const { Supplier } = require('../models');
    let supplierRecord = await Supplier.findOne({ where: { user_id: quote.supplier_user_id } });

    if (!supplierRecord) {
      console.log(`[DEBUG] Supplier profile missing for user_id: ${quote.supplier_user_id}. Attempting to create...`);
      try {
        const user = await User.findByPk(quote.supplier_user_id);
        if (user) {
          supplierRecord = await Supplier.create({
            user_id: user.id,
            name: user.name,
            email: user.email,
            phone: 'N/A',
            address: 'N/A'
          });
          console.log(`[DEBUG] Created new Supplier profile: ID ${supplierRecord.id}`);
        } else {
          console.error(`[ERROR] User not found for ID: ${quote.supplier_user_id}`);
          return res.status(400).json({ message: 'Supplier user account not found' });
        }
      } catch (createErr) {
        console.error('[ERROR] Failed to create supplier profile:', createErr);
        return res.status(500).json({ message: 'Failed to create supplier profile', error: createErr.message });
      }
    } else {
      console.log(`[DEBUG] Found existing Supplier profile: ID ${supplierRecord.id}`);
    }

    // Create Order
    const order = await Order.create({
      quote_id: quote.id,
      supplier_id: supplierRecord.id,
      created_by: req.user.id,
      placed_at: new Date(),
      status: 'order_placed'
    });

    // Create Order Items
    const orderItemsData = [];
    let totalAmount = 0;

    for (const qItemId of selected_items) {
      const qItem = quote.QuoteItems.find(qi => qi.id === qItemId);
      if (qItem && !qItem.is_nil) {
        const quantity = qItem.InquiryItem.quantity;
        const price = qItem.price;
        const total = quantity * price;
        totalAmount += total;

        orderItemsData.push({
          order_id: order.id,
          quote_item_id: qItem.id,
          quantity: quantity,
          price: price,
          brand: qItem.brand_name,
          ingredient_name: qItem.InquiryItem.Ingredient.name,
          unit: qItem.InquiryItem.Ingredient.unit
        });
      }
    }

    await OrderItem.bulkCreate(orderItemsData);

    // Update Quote status
    quote.status = 'order_placed';
    quote.accepted = true;
    quote.accepted_by = req.user.id;
    quote.accepted_at = new Date();
    await quote.save();

    // Send Email
    try {
      const { sendTestEmail } = require('../config/email');

      // 1. Get Primary Email from User (Source of truth for login/notifications)
      const supplierUser = await User.findByPk(quote.supplier_user_id);
      const primaryEmail = supplierUser ? supplierUser.email : null;

      // 2. Get Additional Emails from User
      let additional = supplierUser?.additional_emails || [];
      if (typeof additional === 'string') {
        try { additional = JSON.parse(additional); } catch (e) { additional = []; }
      }

      // 3. Get Contact Email from Supplier Record (fallback/supplementary)
      const contactEmail = supplierRecord ? supplierRecord.contact_email : null;

      // 4. Merge all unique emails
      const uniqueEmails = new Set([primaryEmail, ...additional, contactEmail].filter(Boolean));
      const allEmails = Array.from(uniqueEmails);

      if (allEmails.length === 0) {
        console.warn(`[Quote] No email addresses found for Supplier User ID ${quote.supplier_user_id}`);
      } else {
        const emailItems = orderItemsData.map(item => ({
          ingredient_name: item.ingredient_name,
          brand: item.brand,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: item.quantity * item.price
        }));

        await sendTestEmail(allEmails, {
          type: 'order_multi',
          orderId: order.id,
          items: emailItems,
          grandTotal: totalAmount
        });
        console.log(`[Quote] Email sent to: ${allEmails.join(', ')}`);
      }
    } catch (emailErr) {
      console.error('[Quote] Exception sending email:', emailErr);
    }

    res.json({ message: 'Order placed successfully', data: order });

  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Error placing order', error: error.message });
  }
});

// Delete/Reject Quote
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const quote = await Quotes.findByPk(id);

    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    // We can either hard delete or soft delete (status='rejected')
    // User asked to "remove entire entry", so hard delete is appropriate or soft delete if we want history.
    // Given "remove the entire entry", destroy seems best for now, or status='rejected' and filter out.
    // Let's go with destroy to keep it clean as requested.

    await quote.destroy();

    res.json({ message: 'Quote removed successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ message: 'Error deleting quote', error: error.message });
  }
});

module.exports = router;
