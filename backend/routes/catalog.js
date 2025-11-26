const express = require('express');
const { SupplierCatalog, Ingredient, User } = require('../models');
const authMiddleware = require('../middleware/auth');
const { adminOnly } = require('../middleware/authorization');

const router = express.Router();

// Get all supplier catalog entries (admin only)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const entries = await SupplierCatalog.findAll({
      include: [
        { model: Ingredient, attributes: ['id', 'name'] },
        { model: User, as: 'supplier', attributes: ['id', 'name', 'email', 'phone'] }
      ]
    });

    res.json({
      message: 'Supplier catalog retrieved',
      data: entries
    });
  } catch (error) {
    console.error('Error fetching supplier catalog:', error);
    res.status(500).json({ message: 'Error fetching supplier catalog', error: error.message });
  }
});

// Get catalog for a specific supplier (supplier or admin)
router.get('/supplier/:supplier_user_id', authMiddleware, async (req, res) => {
  try {
    const { supplier_user_id } = req.params;

    // Allow supplier to see only their own catalog, admins can see any
    if (req.user.role === 'supplier' && req.user.id !== parseInt(supplier_user_id)) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own catalog' });
    }

    const entries = await SupplierCatalog.findAll({
      where: { supplier_user_id },
      include: [
        { model: Ingredient, attributes: ['id', 'name'] }
      ]
    });

    res.json({
      message: 'Supplier catalog retrieved',
      data: entries
    });
  } catch (error) {
    console.error('Error fetching supplier catalog:', error);
    res.status(500).json({ message: 'Error fetching supplier catalog', error: error.message });
  }
});

// Add ingredient to supplier catalog (admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { ingredient_id, supplier_user_id, price_hint, available = true } = req.body;

    // Validate required fields
    if (!ingredient_id || !supplier_user_id) {
      return res.status(400).json({ message: 'ingredient_id and supplier_user_id are required' });
    }

    // Verify ingredient exists
    const ingredient = await Ingredient.findByPk(ingredient_id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    // Verify supplier user exists and has role 'supplier'
    const supplier = await User.findByPk(supplier_user_id);
    if (!supplier || supplier.role !== 'supplier') {
      return res.status(404).json({ message: 'Supplier user not found or is not a supplier' });
    }

    // Check if entry already exists
    const existing = await SupplierCatalog.findOne({
      where: { ingredient_id, supplier_user_id }
    });
    if (existing) {
      return res.status(400).json({ message: 'This ingredient is already in the supplier\'s catalog' });
    }

    const catalogEntry = await SupplierCatalog.create({
      ingredient_id,
      supplier_user_id,
      price_hint: price_hint || null,
      available
    });

    res.status(201).json({
      message: 'Ingredient added to supplier catalog',
      data: catalogEntry
    });
  } catch (error) {
    console.error('Error adding to supplier catalog:', error);
    res.status(500).json({ message: 'Error adding to supplier catalog', error: error.message });
  }
});

// Update catalog entry (admin only or supplier themselves)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { price_hint, available } = req.body;

    const entry = await SupplierCatalog.findByPk(id);
    if (!entry) {
      return res.status(404).json({ message: 'Catalog entry not found' });
    }

    // Allow supplier to update only their own, admins can update any
    if (req.user.role === 'supplier' && entry.supplier_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own catalog' });
    }

    if (price_hint !== undefined) entry.price_hint = price_hint;
    if (available !== undefined) entry.available = available;

    await entry.save();

    res.json({
      message: 'Catalog entry updated',
      data: entry
    });
  } catch (error) {
    console.error('Error updating catalog entry:', error);
    res.status(500).json({ message: 'Error updating catalog entry', error: error.message });
  }
});

// Delete from catalog (admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await SupplierCatalog.findByPk(id);
    if (!entry) {
      return res.status(404).json({ message: 'Catalog entry not found' });
    }

    await entry.destroy();

    res.json({ message: 'Catalog entry deleted' });
  } catch (error) {
    console.error('Error deleting catalog entry:', error);
    res.status(500).json({ message: 'Error deleting catalog entry', error: error.message });
  }
});

module.exports = router;
