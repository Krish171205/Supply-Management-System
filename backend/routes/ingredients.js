const express = require('express');
const { Ingredient, SupplierCatalog, User } = require('../models');
const authMiddleware = require('../middleware/auth');
const { adminOnly } = require('../middleware/authorization');

const router = express.Router();

// Get all ingredients with pagination and search
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause.name = { [require('sequelize').Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Ingredient.findAndCountAll({
      where: whereClause,
      offset,
      limit: parseInt(limit),
      order: [['id', 'DESC']]
    });

    res.json({
      ingredients: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get ingredients error:', error);
    res.status(500).json({ message: 'Error fetching ingredients', error: error.message });
  }
});

// Get single ingredient with suppliers
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // Include suppliers from supplier_catalog
    const ingredient = await Ingredient.findByPk(req.params.id);

    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    const catalogEntries = await SupplierCatalog.findAll({
      where: { ingredient_id: req.params.id },
      include: [{ model: User, as: 'supplier', attributes: ['id', 'name', 'email', 'phone'] }]
    });

    const suppliers = catalogEntries.map(c => c.supplier);

    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    res.json({ ingredient, suppliers });
  } catch (error) {
    console.error('Get ingredient error:', error);
    res.status(500).json({ message: 'Error fetching ingredient', error: error.message });
  }
});

// Get suppliers for ingredient
router.get('/:id/suppliers', authMiddleware, async (req, res) => {
  try {
    const catalogEntries = await SupplierCatalog.findAll({
      where: { ingredient_id: req.params.id, available: true },
      include: [{ model: User, as: 'supplier', attributes: ['id', 'name', 'email', 'phone'] }]
    });

    const suppliers = catalogEntries.map(c => c.supplier);

    res.json({ suppliers });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
  }
});

// Create ingredient (admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Ingredient name is required' });
    }

    const existingIngredient = await Ingredient.findOne({ where: { name } });
    if (existingIngredient) {
      return res.status(400).json({ message: 'Ingredient already exists' });
    }

    const ingredient = await Ingredient.create({ name });

    res.status(201).json({
      message: 'Ingredient created successfully',
      ingredient
    });
  } catch (error) {
    console.error('Create ingredient error:', error);
    res.status(500).json({ message: 'Error creating ingredient', error: error.message });
  }
});

// Update ingredient (admin only)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const ingredient = await Ingredient.findByPk(req.params.id);

    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    const { name } = req.body;

    if (name) ingredient.name = name;

    await ingredient.save();

    res.json({
      message: 'Ingredient updated successfully',
      ingredient
    });
  } catch (error) {
    console.error('Update ingredient error:', error);
    res.status(500).json({ message: 'Error updating ingredient', error: error.message });
  }
});

// Delete ingredient (admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const ingredient = await Ingredient.findByPk(req.params.id);

    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    await ingredient.destroy();

    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    console.error('Delete ingredient error:', error);
    res.status(500).json({ message: 'Error deleting ingredient', error: error.message });
  }
});

module.exports = router;
