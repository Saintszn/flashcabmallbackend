// backend/controllers/orderController.js

const db = require('../config/db');

// Place an order
exports.placeOrder = (req, res) => {
  const { userId, products, totalAmount, shippingAddress, shippingClass } = req.body;

  if (
    !userId ||
    !products ||
    !totalAmount ||
    !shippingAddress ||
    !shippingClass
  ) {
    return res.status(400).json({ message: 'Order details are incomplete.' });
  }

  const query = `
    INSERT INTO Orders
      (userId, products, totalAmount, shippingAddress, shippingClass, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const params = [
    userId,
    JSON.stringify(products),
    totalAmount,
    shippingAddress,
    JSON.stringify(shippingClass),
    'Pending'
  ];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error placing order:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }

    const orderId = results.insertId;

    res
      .status(201)
      .json({ message: 'Order placed successfully', orderId });
  });
};

// Update order status (admin)
exports.updateOrderStatus = (req, res) => {
  const { orderId, status } = req.body;
  if (!orderId || !status) {
    return res.status(400).json({ message: 'Order ID and status are required.' });
  }
  const query = 'UPDATE Orders SET status = ? WHERE id = ?';
  db.query(query, [status, orderId], err => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }

    // fetch the userId for this order
    db.query(
      'SELECT userId FROM Orders WHERE id = ?',
      [orderId],
      (err2, results2) => {
        if (!err2 && results2.length) {
          const userId = results2[0].userId;
          // no-op after removing Pusher
        }
      }
    );

    res.status(200).json({ message: 'Order status updated successfully' });
  });
};

// Get order details by ID
exports.getOrderDetails = (req, res) => {
  const { orderId } = req.params;
  const query = 'SELECT * FROM Orders WHERE id = ?';
  db.query(query, [orderId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length === 0)
      return res.status(404).json({ message: 'Order not found' });
    const order = results[0];
    // parse JSON fields
    order.products = JSON.parse(order.products);
    try {
      order.shippingClass = JSON.parse(order.shippingClass);
    } catch {
      order.shippingClass = {};
    }
    res.status(200).json(order);
  });
};

// (Optional) Get only pending / live orders
exports.getLiveOrders = (req, res) => {
  const query = "SELECT * FROM Orders WHERE status = 'Pending'";
  db.query(query, (err, results) => {
    if (err)
      return res.status(500).json({ message: 'Database error', error: err });
    // parse each before returning
    const orders = results.map(o => ({
      ...o,
      products: JSON.parse(o.products),
      shippingClass: (() => {
        try { return JSON.parse(o.shippingClass); }
        catch { return {}; }
      })()
    }));
    res.status(200).json(orders);
  });
};

// get orders by ID
exports.getOrderByID = (req, res) => {
  const { orderId } = req.params;
  const query = 'SELECT * FROM `Orders` WHERE id = ?';

  db.query(query, [orderId], (err, results) => {
    if (err) {
      console.error('Database error fetching order by ID:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = results[0];
    // Parse JSON fields if stored as strings
    try {
      order.products = JSON.parse(order.products);
    } catch {
      order.products = [];
    }
    try {
      order.shippingClass = JSON.parse(order.shippingClass);
    } catch {
      order.shippingClass = {};
    }

    res.status(200).json(order);
  });
};

// Retrieve all orders (for listing in user-app and admin dashboard)
exports.getAllOrders = (req, res) => {
  const query = `
    SELECT 
      o.id,
      o.userId,
      o.products,
      o.totalAmount,
      o.status,
      o.createdAt,
      o.shippingAddress,
      o.shippingClass,
      u.name  AS clientName,
      u.phone AS phone
    FROM Orders o
    JOIN Users u ON o.userId = u.id
    ORDER BY o.createdAt DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error fetching orders:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
    // parse JSON fields
    const orders = results.map(o => ({
      ...o,
      products: JSON.parse(o.products),
      shippingClass: (() => {
        try { return JSON.parse(o.shippingClass); }
        catch { return {}; }
      })()
    }));
    res.status(200).json(orders);
  });
};
