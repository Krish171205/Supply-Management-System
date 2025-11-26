const express = require('express');
const { Inquiry, SupplierCatalog, User, Ingredient } = require('../models');
const authMiddleware = require('../middleware/auth');
const { adminOnly, supplierOnly } = require('../middleware/authorization');

const router = express.Router();

// Create inquiry (admin only) - enforces supplier_catalog check
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { ingredient_id, supplier_user_id, notes } = req.body;

    // Validate required fields
    if (!ingredient_id || !supplier_user_id) {
      return res.status(400).json({ message: 'ingredient_id and supplier_user_id are required' });
    }

    // CRITICAL: Check that this supplier+ingredient combination exists in supplier_catalog
    const catalogEntry = await SupplierCatalog.findOne({
      where: { ingredient_id, supplier_user_id }
    });

    if (!catalogEntry) {
      return res.status(400).json({
        message: 'Cannot create inquiry: This supplier does not list this ingredient in their catalog'
      });
    }

    // Verify supplier user exists and is a supplier
    const supplier = await User.findByPk(supplier_user_id);
    if (!supplier || supplier.role !== 'supplier') {
      return res.status(404).json({ message: 'Supplier user not found or is not a supplier' });
    }

    const inquiry = await Inquiry.create({
      ingredient_id,
      supplier_user_id,
      created_by: req.user.id,
      notes: notes || null,
      status: 'open'
    });

    // Send inquiry details email if supplier has email
    if (supplier.email) {
      try {
        const { sendTestEmail } = require('../config/email');
        // Get ingredient name
        const ingredient = await Ingredient.findByPk(ingredient_id);
        await sendTestEmail(supplier.email, {
          type: 'inquiry',
          ingredient_name: ingredient ? ingredient.name : ingredient_id,
          notes
        });
      } catch (err) {
        console.error('Error sending inquiry email:', err);
      }
    }

    res.status(201).json({
      message: 'Inquiry created successfully',
      data: inquiry
    });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({ message: 'Error creating inquiry', error: error.message });
  }
});

// Get all inquiries (admin sees all, supplier sees only their own)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let where = {};

    // RLS: Suppliers only see inquiries where supplier_user_id = their_user_id
    if (req.user.role === 'supplier') {
      where.supplier_user_id = req.user.id;
    }

    const inquiries = await Inquiry.findAll({
      where,
      include: [
        { model: Ingredient, attributes: ['id', 'name'] },
        { model: User, as: 'supplierUser', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [['id', 'DESC']]
    });

    res.json({
      message: 'Inquiries retrieved',
      data: inquiries
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ message: 'Error fetching inquiries', error: error.message });
  }
});

// Get single inquiry
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const inquiry = await Inquiry.findByPk(id, {
      include: [
        { model: Ingredient, attributes: ['id', 'name'] },
        { model: User, as: 'supplierUser', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    // RLS: Supplier can only see their own inquiries
    if (req.user.role === 'supplier' && inquiry.supplier_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own inquiries' });
    }

    res.json({
      message: 'Inquiry retrieved',
      data: inquiry
    });
  } catch (error) {
    console.error('Error fetching inquiry:', error);
    res.status(500).json({ message: 'Error fetching inquiry', error: error.message });
  }
});

// Update inquiry status (admin or supplier for their own inquiry to set 'responded')
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    const inquiry = await Inquiry.findByPk(id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    // Only admin can set any status. Supplier can only set their own inquiry to 'responded'.
    if (req.user.role === 'supplier') {
      if (inquiry.supplier_user_id !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: You can only update your own inquiries' });
      }
      if (status !== 'responded') {
        return res.status(403).json({ message: 'Suppliers can only set status to responded' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin or assigned supplier only.' });
    }

    inquiry.status = status;
    await inquiry.save();

    res.json({
      message: 'Inquiry status updated',
      data: inquiry
    });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).json({ message: 'Error updating inquiry', error: error.message });
  }
});

module.exports = router;
