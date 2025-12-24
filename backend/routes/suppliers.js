const express = require('express');
const { User, SupplierCatalog, Ingredient } = require('../models');
const authMiddleware = require('../middleware/auth');
const { adminOnly, supplierOnly } = require('../middleware/authorization');

const router = express.Router();

// Get all suppliers (admin only)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { role: 'supplier' };
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'phone', 'is_active', 'created_at'],
      include: [{
        model: require('../models').Supplier,
        as: 'supplierProfile',
        attributes: ['payment_type']
      }],
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    res.json({
      suppliers: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
  }
});

// Get suppliers by ingredient (admin only)
router.get('/by-ingredient/:ingredientId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const entries = await SupplierCatalog.findAll({
      where: { ingredient_id: req.params.ingredientId, available: true },
      include: [{ model: User, as: 'supplier', attributes: ['id', 'name', 'email', 'phone'] }]
    });

    const suppliers = entries.map(e => e.supplier);

    res.json({ suppliers });
  } catch (error) {
    console.error('Get suppliers by ingredient error:', error);
    res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
  }
});

// Get supplier profile (own profile for suppliers)
router.get('/profile/me', authMiddleware, supplierOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'name', 'email', 'phone', 'is_active', 'created_at'] });
    if (!user) return res.status(404).json({ message: 'Supplier profile not found' });

    const catalog = await SupplierCatalog.findAll({ where: { supplier_user_id: user.id }, include: [{ model: Ingredient, attributes: ['id', 'name'] }] });

    res.json({ supplier: user, catalog });
  } catch (error) {
    console.error('Get supplier profile error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Get single supplier (admin only)
router.get('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: ['id', 'name', 'email', 'phone', 'is_active', 'created_at'] });
    if (!user) return res.status(404).json({ message: 'Supplier not found' });

    const catalog = await SupplierCatalog.findAll({ where: { supplier_user_id: user.id }, include: [{ model: Ingredient, attributes: ['id', 'name'] }] });

    res.json({ supplier: user, catalog });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ message: 'Error fetching supplier', error: error.message });
  }
});

// Create supplier (admin only)
// Create supplier user (admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !password) return res.status(400).json({ message: 'Name and password are required' });
    if (!email && !phone) return res.status(400).json({ message: 'At least email or phone is required' });

    if (email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ message: 'Email already exists' });
    }

    const user = await User.create({
      name,
      email: email || null,
      phone: phone || null,
      role: 'supplier',
      hashed_password: password,
      is_active: true,
      additional_emails: req.body.additional_emails || []
    });

    // Send test email if email is provided
    if (email) {
      try {
        const { sendTestEmail } = require('../config/email');

        // Parse additional emails safely
        let additional = req.body.additional_emails || [];
        if (typeof additional === 'string') {
          try { additional = JSON.parse(additional); } catch (e) { additional = []; }
        }

        const allEmails = [email, ...additional];
        console.log('DEBUG: Sending welcome email (legacy route) to:', allEmails);

        await sendTestEmail(allEmails);
      } catch (err) {
        console.error('Error sending supplier email:', err);
      }
    }

    // Create Supplier Profile
    const { Supplier } = require('../models');
    await Supplier.create({
      user_id: user.id,
      name: user.name,
      contact_email: user.email,
      phone: user.phone,
      payment_type: req.body.payment_type || 'advance'
    });

    res.status(201).json({ message: 'Supplier user created', user: { id: user.id, name: user.name, email: user.email, phone: user.phone, payment_type: req.body.payment_type || 'advance' } });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ message: 'Error creating supplier', error: error.message });
  }
});

// Update supplier profile (supplier can update own, admin can update any)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Check authorization - supplier can only update own profile
    if (req.user.role === 'supplier' && supplier.id !== req.user.supplier_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, contact_email, phone, address } = req.body;

    if (name) supplier.name = name;
    if (contact_email) supplier.contact_email = contact_email;
    if (phone) supplier.phone = phone;
    if (address) supplier.address = address;

    await supplier.save();

    res.json({
      message: 'Supplier updated successfully',
      supplier
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ message: 'Error updating supplier', error: error.message });
  }
});

// Add ingredient to supplier
// Add ingredient to supplier (creates supplier_catalog entry)
router.post('/:supplierId/ingredients/:ingredientId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { supplierId, ingredientId } = req.params;

    const supplierUser = await User.findByPk(supplierId);
    if (!supplierUser || supplierUser.role !== 'supplier') return res.status(404).json({ message: 'Supplier user not found' });

    const ingredient = await Ingredient.findByPk(ingredientId);
    if (!ingredient) return res.status(404).json({ message: 'Ingredient not found' });

    const existing = await SupplierCatalog.findOne({ where: { ingredient_id: ingredientId, supplier_user_id: supplierId } });
    if (existing) return res.status(400).json({ message: 'Supplier already has this ingredient in catalog' });

    const entry = await SupplierCatalog.create({ ingredient_id: ingredientId, supplier_user_id: supplierId, available: true });

    res.status(201).json({ message: 'Ingredient added to supplier catalog', entry });
  } catch (error) {
    console.error('Add ingredient to supplier error:', error);
    res.status(500).json({ message: 'Error adding ingredient', error: error.message });
  }
});

// Remove ingredient from supplier
router.delete('/:supplierId/ingredients/:ingredientId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { supplierId, ingredientId } = req.params;

    const deleted = await SupplierCatalog.destroy({ where: { ingredient_id: ingredientId, supplier_user_id: supplierId } });
    if (deleted === 0) return res.status(404).json({ message: 'Catalog entry not found' });
    res.json({ message: 'Ingredient removed from supplier catalog' });
  } catch (error) {
    console.error('Remove ingredient error:', error);
    res.status(500).json({ message: 'Error removing ingredient', error: error.message });
  }
});

module.exports = router;
