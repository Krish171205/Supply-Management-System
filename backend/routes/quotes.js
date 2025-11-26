const express = require('express');
const { Quotes, Inquiry, User, Ingredient } = require('../models');
const authMiddleware = require('../middleware/auth');
const { adminOnly, supplierOnly } = require('../middleware/authorization');

const router = express.Router();

// Supplier creates a quote in response to an inquiry
router.post('/', authMiddleware, supplierOnly, async (req, res) => {
  try {
    const { inquiry_id, price } = req.body;

    // Validate required fields
    if (!inquiry_id || price === undefined) {
      return res.status(400).json({ message: 'inquiry_id and price are required' });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }

    // Get inquiry
    const inquiry = await Inquiry.findByPk(inquiry_id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    // RLS: Supplier can only respond to inquiries sent to them
    if (inquiry.supplier_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: This inquiry is not for you' });
    }

    // Check if quote already exists
    const existingQuote = await Quotes.findOne({
      where: { inquiry_id, supplier_user_id: req.user.id }
    });

    if (existingQuote) {
      return res.status(400).json({ message: 'You have already submitted a quote for this inquiry' });
    }


    const quote = await Quotes.create({
      inquiry_id,
      ingredient_id: inquiry.ingredient_id,
      supplier_user_id: req.user.id,
      price,
      accepted: false,
      status: 'quoted',
      responded_by: req.user.id,
      responded_at: new Date()
    });

    res.status(201).json({
      message: 'Quote submitted successfully',
      data: quote
    });
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ message: 'Error creating quote', error: error.message });
  }
});

// Get all quotes (admin sees all, supplier sees only their own)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let where = {};

    // RLS: Suppliers only see quotes where supplier_user_id = their_user_id
    if (req.user.role === 'supplier') {
      where.supplier_user_id = req.user.id;
    }

    const quotes = await Quotes.findAll({
      where,
      include: [
        { model: Inquiry, attributes: ['id', 'notes'] },
        { model: Ingredient, attributes: ['id', 'name'] },
        { model: User, as: 'supplier', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'respondedByUser', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'acceptedByUser', attributes: ['id', 'name', 'email'] }
      ],
      order: [['id', 'DESC']]
    });

    res.json({
      message: 'Quotes retrieved',
      data: quotes
    });
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
        { model: Inquiry, attributes: ['id', 'notes'] },
        { model: Ingredient, attributes: ['id', 'name'] },
        { model: User, as: 'supplier', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'respondedByUser', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'acceptedByUser', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // RLS: Supplier can only see their own quotes
    if (req.user.role === 'supplier' && quote.supplier_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own quotes' });
    }

    res.json({
      message: 'Quote retrieved',
      data: quote
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ message: 'Error fetching quote', error: error.message });
  }
});

// Admin accepts a quote and sets order details
router.put('/:id/accept', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { amt } = req.body;

    if (amt === undefined || isNaN(amt) || amt <= 0) {
      return res.status(400).json({ message: 'amt (order amount/quantity) must be a positive number' });
    }

    const quote = await Quotes.findByPk(id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Update quote: mark as accepted and set order details
    quote.accepted = true;
    quote.accepted_by = req.user.id;
    quote.accepted_at = new Date();
    quote.amt = amt;
    quote.status = 'order_placed';
    quote.placed_at = new Date();

    await quote.save();

    // Send order email to supplier
    try {
      const { sendTestEmail } = require('../config/email');
      const ingredient = await Ingredient.findByPk(quote.ingredient_id);
      const supplier = await User.findByPk(quote.supplier_user_id);
      const price = parseFloat(quote.price) || 0;
      const quantity = parseFloat(quote.amt) || 0;
      const total = price * quantity;
      if (supplier && supplier.email) {
        await sendTestEmail(supplier.email, {
          type: 'order',
          ingredient_name: ingredient ? ingredient.name : quote.ingredient_id,
          price,
          quantity,
          total
        });
      }
    } catch (err) {
      console.error('Error sending order email:', err);
    }

    res.json({
      message: 'Quote accepted and order placed',
      data: quote
    });
  } catch (error) {
    console.error('Error accepting quote:', error);
    res.status(500).json({ message: 'Error accepting quote', error: error.message });
  }
});

// Update quote status (admin or supplier, depending on status)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate allowed statuses
    const allowedStatuses = ['quoted', 'order_placed', 'order_in_process', 'order_shipped', 'order_received', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    const quote = await Quotes.findByPk(id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // RLS: Suppliers can update their own quotes, admins can update any
    if (req.user.role === 'supplier' && quote.supplier_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own quotes' });
    }

    // Update status
    quote.status = status;

    // Set timestamp based on status
    if (status === 'order_shipped' && !quote.shipped_at) {
      quote.shipped_at = new Date();
    }
    if (status === 'order_received' && !quote.received_at) {
      quote.received_at = new Date();
    }

    await quote.save();

    res.json({
      message: 'Quote status updated',
      data: quote
    });
  } catch (error) {
    console.error('Error updating quote status:', error);
    res.status(500).json({ message: 'Error updating quote status', error: error.message });
  }
});

// Cancel a quote (admin only)
router.put('/:id/cancel', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const quote = await Quotes.findByPk(id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    quote.status = 'cancelled';
    await quote.save();

    res.json({
      message: 'Quote cancelled',
      data: quote
    });
  } catch (error) {
    console.error('Error cancelling quote:', error);
    res.status(500).json({ message: 'Error cancelling quote', error: error.message });
  }
});

module.exports = router;
