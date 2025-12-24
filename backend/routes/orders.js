const express = require('express');
const { Order, OrderItem, Supplier, User, Quotes } = require('../models');
const authMiddleware = require('../middleware/auth');
const { adminOnly, supplierOnly } = require('../middleware/authorization');
const { Op } = require('sequelize');

const router = express.Router();

// Get all orders
router.get('/admin/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    let where = {};

    if (status) where.status = status;
    if (startDate || endDate) {
      where.placed_at = {};
      if (startDate) where.placed_at[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.placed_at[Op.lte] = end;
      }
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: OrderItem },
        { model: Supplier, include: [{ model: User, attributes: ['name', 'email'] }] },
        { model: User, as: 'admin', attributes: ['name', 'email'] }
      ],
      offset,
      limit: parseInt(limit),
      order: [['placed_at', 'DESC']]
    });

    res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      orders: rows
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get supplier orders
router.get('/supplier/all', authMiddleware, supplierOnly, async (req, res) => {
  try {
    // Need to find Supplier ID for this user
    // Assuming we can link via User or Supplier table
    // For now, let's assume we filter by checking Supplier.user_id

    // This is tricky if Order links to Supplier ID but we only have User ID.
    // We need to fetch Supplier first.
    // const supplier = await Supplier.findOne({ where: { user_id: req.user.id } });
    // if (!supplier) ...

    // Let's try to include Supplier in the query and filter there?
    // Sequelize doesn't support filtering on included models at top level easily without required: true

    const orders = await Order.findAll({
      include: [
        {
          model: Supplier,
          where: { user_id: req.user.id }, // This filters orders for this supplier
          required: true
        },
        { model: OrderItem },
        { model: User, as: 'admin', attributes: ['name', 'email'] }
      ],
      order: [['placed_at', 'DESC']]
    });

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching supplier orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Update order status
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Validate permissions (Admin or Supplier owner)
    // ...

    order.status = status;
    if (status === 'order_shipped') order.shipped_at = new Date();
    if (status === 'order_received') order.arrived_at = new Date();

    await order.save();
    res.json({ message: 'Status updated', data: order });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

module.exports = router;
