const db = require('../config/db');
const pusher = require('../config/pusher');

function queryAsync(sql) {
  return new Promise((resolve, reject) => {
    db.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

exports.getStats = async (req, res) => {
  try {
    const [userResults, productResults, orderResults, revenueResults] = await Promise.all([
      queryAsync('SELECT COUNT(*) AS userCount FROM Users'),
      queryAsync('SELECT COUNT(*) AS productCount FROM Products'),
      queryAsync('SELECT COUNT(*) AS orderCount FROM Orders'),
      queryAsync('SELECT COALESCE(SUM(totalAmount), 0) AS totalRevenue FROM Orders')
    ]);

    const stats = {
      userCount: userResults[0].userCount,
      productCount: productResults[0].productCount,
      orderCount: orderResults[0].orderCount,
      totalRevenue: revenueResults[0].totalRevenue
    };

    // Broadcast updated stats via Pusher
    pusher.trigger('admin', 'statsUpdated', stats);

    res.status(200).json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Database error', error });
  }
};
