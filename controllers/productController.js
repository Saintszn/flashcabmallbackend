// Project-root/backend/controllers/productController.js

const db = require('../config/db');

exports.createProduct = (req, res) => {
  let {
    name,
    description = null,
    price,
    categoryId,
    subCategoryId,
    imageUrl,
    rating,
    size = null,
    brands = null,
    color
  } = req.body;

  // Validate required fields
  if (!name || price == null || !categoryId || !imageUrl || rating == null || !color) {
    return res
      .status(400)
      .json({ message: 'Name, price, category, image URL, rating, and color are required.' });
  }

  // Convert/parse values accordingly
  const validPrice = parseFloat(price);
  const validRating = parseFloat(rating);
  const validCategoryId = parseInt(categoryId, 10);
  const validSubCategory = subCategoryId ? parseInt(subCategoryId, 10) : null;
  const validSize = size ? size.trim() : null;
  const validBrands = brands ? brands.trim() : null;

  const query = `
    INSERT INTO Products
      (name, description, price, categoryId, subCategoryId, imageUrl, rating, size, brands, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      name,
      description,
      validPrice,
      validCategoryId,    // Use the correct category ID
      validSubCategory,   // Use the subCategory ID (or null)
      imageUrl,
      validRating,
      validSize,
      validBrands,
      color
    ],
    (err, results) => {
      if (err) {
        console.error('Database error inserting product:', err);
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.status(201).json({ message: 'Product created successfully', productId: results.insertId });
    }
  );
};

// Get all products (with optional category filter)
exports.getProducts = (req, res) => {
  const { categoryId } = req.query;
  let sql = 'SELECT id, name, price, imageUrl, rating, createdAt FROM Products';
  const params = [];
  if (categoryId) {
    sql += ' WHERE categoryId = ?';
    params.push(parseInt(categoryId, 10));
  }

    // Always sort results by creation date (newest first)
    sql += ' ORDER BY createdAt DESC';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Database error fetching products:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
    // Check for active flash sale
    const flashSaleSql = 'SELECT discount FROM Flashsale WHERE expiryDate > NOW() LIMIT 1';
    db.query(flashSaleSql, (err2, flashResults) => {
      if (!err2 && flashResults.length > 0) {
        const discount = parseFloat(flashResults[0].discount);
        results = results.map(item => {
          const newPrice = item.price * (1 - discount / 100);
          // Round or format as needed:
          item.price = parseFloat(newPrice.toFixed(2));
          return item;
        });
      }
      // Send the (possibly discounted) results
      res.status(200).json(results);
    });
  });
};


// Get product by ID
exports.getProductById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM Products WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    let product = results[0];
    // Apply flash sale discount if active
    const flashSaleSql = 'SELECT discount FROM Flashsale WHERE expiryDate > NOW() LIMIT 1';
    db.query(flashSaleSql, (err2, flashResults) => {
      if (!err2 && flashResults.length > 0) {
        const discount = parseFloat(flashResults[0].discount);
        const newPrice = product.price * (1 - discount / 100);
        product.price = parseFloat(newPrice.toFixed(2));
      }
      res.status(200).json(product);
    });
  });
};

// Search products by name
exports.searchProducts = (req, res) => {
  const q = req.query.q && req.query.q.trim();
  if (!q) {
    return res.status(400).json({ message: 'Query parameter q is required.' });
  }
  const sql = `
    SELECT id, name, price, imageUrl, rating
    FROM Products
    WHERE name LIKE ?
  `;
  const likePattern = `%${q}%`;
  db.query(sql, [likePattern], (err, results) => {
    if (err) {
      console.error('Database error on searchProducts:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
    // Apply flash sale discount if active
    const flashSaleSql = 'SELECT discount FROM Flashsale WHERE expiryDate > NOW() LIMIT 1';
    db.query(flashSaleSql, (err2, flashResults) => {
      if (!err2 && flashResults.length > 0) {
        const discount = parseFloat(flashResults[0].discount);
        results = results.map(item => {
          const newPrice = item.price * (1 - discount / 100);
          item.price = parseFloat(newPrice.toFixed(2));
          return item;
        });
      }
      res.status(200).json(results);
    });
  });
};




// Update product
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, description, price, categoryId, subCategoryId, imageUrl } = req.body;
  const query = 'UPDATE Products SET name = ?, description = ?, price = ?, categoryId = ?, subCategoryId = ?, imageUrl = ? WHERE id = ?';
  db.query(query, [name, description, price, categoryId, subCategoryId, imageUrl, id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json({ message: 'Product updated successfully' });
  });
};

// Delete product
exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM Products WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json({ message: 'Product deleted successfully' });
  });
};
