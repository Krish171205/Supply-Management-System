const express = require('express');
const { Order, InquiryResponse, Inquiry, Supplier, User, Ingredient } = require('../models');
const authMiddleware = require('../middleware/auth');
const { adminOnly, supplierOnly } = require('../middleware/authorization');

const router = express.Router();

// Create order from inquiry response (admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { inquiryResponseId } = req.body;

    if (!inquiryResponseId) {
      return res.status(400).json({ message: 'Inquiry Response ID is required' });
    }

    const inquiryResponse = await InquiryResponse.findByPk(inquiryResponseId, {
      include: [{ model: Inquiry }]
    });

    if (!inquiryResponse) {
      return res.status(404).json({ message: 'Inquiry response not found' });
    }

    const inquiry = inquiryResponse.Inquiry;

    if (inquiry.adminId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if order already exists for this response
    const existingOrder = await Order.findOne({ where: { inquiryResponseId } });
    if (existingOrder) {
      return res.status(400).json({ message: 'Order already exists for this response' });
    }

    const order = await Order.create({
      inquiryResponseId,
      supplierId: inquiryResponse.supplierId,
      adminId: req.user.id,
      quantity: inquiry.quantity,
      price: inquiryResponse.quotedPrice,
      status: 'pending'
    });

    // Update inquiry status
    inquiry.status = 'ordered';
    await inquiry.save();

    // Update inquiry response status
    inquiryResponse.status = 'accepted';
    await inquiryResponse.save();

    // Emit WebSocket event
    req.io.emit('orderCreated', {
      orderId: order.id,
      inquiryId: inquiry.id,
      supplierId: inquiryResponse.supplierId
    });

    // Send order details email if supplier has email
    const supplier = await Supplier.findByPk(inquiryResponse.supplierId);
    if (supplier && supplier.contact_email) {
      try {
        const { sendTestEmail } = require('../config/email');
        const ingredient = await Ingredient.findByPk(inquiry.ingredientId);
        const price = parseFloat(inquiryResponse.quotedPrice) || 0;
        const quantity = parseFloat(inquiry.quantity) || 0;
        const total = price * quantity;
        await sendTestEmail(supplier.contact_email, {
          type: 'order',
          ingredient_name: ingredient ? ingredient.name : inquiry.ingredientId,
          price,
          quantity,
          total
        });
      } catch (err) {
        console.error('Error sending order email:', err);
      }
    }

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Get all orders (admin only)
router.get('/admin/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { adminId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Supplier,
          include: [{ model: User, attributes: ['username', 'email', 'phone'] }]
        },
        {
          model: InquiryResponse,
          include: [
            {
              model: Inquiry,
              include: [{ model: Ingredient }]
            }
          ]
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      orders: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get supplier orders (supplier only)
router.get('/supplier/all', authMiddleware, supplierOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get supplier ID
    const supplier = await Supplier.findOne({ where: { userId: req.user.id } });
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier profile not found' });
    }

    let whereClause = { supplierId: supplier.id };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, attributes: ['username', 'email'], as: 'admin' },
        {
          model: InquiryResponse,
          include: [
            {
              model: Inquiry,
              include: [{ model: Ingredient }]
            }
          ]
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      orders: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get supplier orders error:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get single order
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Supplier,
          include: [{ model: User, attributes: ['username', 'email', 'phone'] }]
        },
        { model: User, attributes: ['username', 'email'], as: 'admin' },
        {
          model: InquiryResponse,
          include: [
            {
              model: Inquiry,
              include: [{ model: Ingredient }]
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (req.user.role === 'admin' && order.adminId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'supplier') {
      const supplier = await Supplier.findOne({ where: { userId: req.user.id } });
      if (!supplier || order.supplierId !== supplier.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

// Update order status
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    // Validate input
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ message: 'Status is required and must be a string' });
    }

    if (!['pending', 'confirmed', 'shipped', 'received', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: pending, confirmed, shipped, received, cancelled' 
      });
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization checks
    if (req.user.role === 'admin' && order.adminId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'supplier') {
      const supplier = await Supplier.findOne({ where: { userId: req.user.id } });
      if (!supplier || order.supplierId !== supplier.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Suppliers can only change status from pending to shipped or shipped to received
      if (order.status === 'pending' && status !== 'shipped') {
        return res.status(400).json({ message: 'Supplier can only mark order as shipped' });
      }
      if (order.status === 'shipped' && status !== 'received') {
        return res.status(400).json({ message: 'Supplier can only mark order as received' });
      }
    }

    // Set timestamp for shipped status
    if (status === 'shipped' && !order.shippedDate) {
      order.shippedDate = new Date();
    }

    // Set timestamp for received status
    if (status === 'received' && !order.arrivedDate) {
      order.arrivedDate = new Date();
    }

    order.status = status;
    await order.save();

    // Emit WebSocket event
    req.io.emit('orderUpdated', {
      orderId: order.id,
      status,
      supplierId: order.supplierId
    });

    res.json({
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Error updating order', error: error.message });
  }
});

module.exports = router;
