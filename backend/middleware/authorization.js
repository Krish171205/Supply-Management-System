const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  next();
};

const supplierOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (req.user.role !== 'supplier') {
    return res.status(403).json({ message: 'Access denied. Supplier only.' });
  }

  next();
};

module.exports = { adminOnly, supplierOnly };
