const express = require('express');
const { Inquiry, InquiryItem, SupplierCatalog, User, Ingredient } = require('../models');
const authMiddleware = require('../middleware/auth');
const { adminOnly, supplierOnly } = require('../middleware/authorization');

const router = express.Router();

// Create inquiry (admin only) - grouped by supplier
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { ingredients, supplier_user_id, notes } = req.body;

    // ingredients: [{ id, brands, quantity }, ...]
    // supplier_user_id: [id1, id2, ...]

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: 'At least one ingredient is required' });
    }

    const supplierIds = Array.isArray(supplier_user_id) ? supplier_user_id : [supplier_user_id];
    if (supplierIds.length === 0) {
      return res.status(400).json({ message: 'At least one supplier is required' });
    }

    const createdInquiries = [];
    const errors = [];

    // Process per supplier
    for (const supId of supplierIds) {
      try {
        // 1. Validate Supplier
        const supplier = await User.findByPk(supId);
        if (!supplier || supplier.role !== 'supplier') {
          errors.push(`User ${supId} is not a valid supplier`);
          continue;
        }

        // 2. Filter ingredients this supplier offers
        const validItems = [];
        for (const item of ingredients) {
          const catalogEntry = await SupplierCatalog.findOne({
            where: { ingredient_id: item.id, supplier_user_id: supId }
          });
          if (catalogEntry) {
            validItems.push(item);
          } else {
            // Optional: Log that supplier doesn't have this item
            // console.log(`Supplier ${supId} does not have ingredient ${item.id}`);
          }
        }

        if (validItems.length === 0) {
          errors.push(`Supplier ${supplier.name} does not offer any of the selected ingredients`);
          continue;
        }

        // 3. Create Inquiry Envelope
        const inquiry = await Inquiry.create({
          supplier_user_id: supId,
          created_by: req.user.id,
          notes: notes || null,
          status: 'open'
        });

        // 4. Create Inquiry Items
        const inquiryItemsData = validItems.map(item => ({
          inquiry_id: inquiry.id,
          ingredient_id: item.id,
          quantity: item.quantity || 0,
          brands: item.brands || []
        }));

        await InquiryItem.bulkCreate(inquiryItemsData);

        createdInquiries.push(inquiry);

        // 5. Send Email
        if (supplier.email) {
          // Fetch ingredient names for email
          const itemDetails = await Promise.all(validItems.map(async (item) => {
            const ing = await Ingredient.findByPk(item.id);
            return {
              name: ing ? ing.name : `ID: ${item.id}`,
              brands: item.brands && item.brands.length > 0 ? item.brands.join(', ') : 'Any',
              quantity: item.quantity,
              unit: ing ? ing.unit : ''
            };
          }));

          // Parse additional emails
          let additional = supplier.additional_emails || [];
          if (typeof additional === 'string') {
            try { additional = JSON.parse(additional); } catch (e) { additional = []; }
          }
          const allEmails = [supplier.email, ...additional];

          const { sendTestEmail } = require('../config/email');
          // We need to update sendTestEmail to handle multiple items. 
          // For now, passing the list as a special object or assuming template handles it.
          // Let's assume we'll update email config later.
          sendTestEmail(allEmails, {
            type: 'inquiry_multi', // New type for multi-item
            items: itemDetails,
            notes
          }).catch(err => console.error(`Error sending email to ${allEmails.join(', ')}:`, err));
        }

      } catch (innerErr) {
        console.error(`Error processing Supplier ${supId}:`, innerErr);
        errors.push(`Error for Supplier ${supId}: ${innerErr.message}`);
      }
    }

    res.status(201).json({
      message: `Processed inquiries. Created: ${createdInquiries.length}. Errors: ${errors.length}`,
      data: createdInquiries,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({ message: 'Error creating inquiry', error: error.message });
  }
});

// Get all inquiries
router.get('/', authMiddleware, async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'supplier') {
      where.supplier_user_id = req.user.id;
    }

    const inquiries = await Inquiry.findAll({
      where,
      include: [
        {
          model: InquiryItem,
          include: [{ model: Ingredient, attributes: ['id', 'name', 'unit'] }]
        },
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
        {
          model: InquiryItem,
          include: [{ model: Ingredient, attributes: ['id', 'name', 'unit'] }]
        },
        { model: User, as: 'supplierUser', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    if (req.user.role === 'supplier' && inquiry.supplier_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
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

// Update status
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const inquiry = await Inquiry.findByPk(id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    if (req.user.role === 'supplier') {
      if (inquiry.supplier_user_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
      if (status !== 'responded') return res.status(403).json({ message: 'Invalid status change' });
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    inquiry.status = status;
    await inquiry.save();

    res.json({ message: 'Status updated', data: inquiry });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

module.exports = router;
