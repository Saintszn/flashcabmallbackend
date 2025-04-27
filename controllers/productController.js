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

// Get all products, or only those in a given category
exports.getProducts = (req, res) => {
  const { categoryId } = req.query;
  let sql = 'SELECT id, name, price, imageUrl, description, rating FROM Products';
  const params = [];

  if (categoryId) {
    sql += ' WHERE categoryId = ?';
    params.push(parseInt(categoryId, 10));
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Database error fetching products by category:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.status(200).json(results);
  });
};




// Get product by id
exports.getProductById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM Products WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(results[0]);
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


exports.searchProducts = (req, res) => {
  const q = req.query.q && req.query.q.trim();
  if (!q) {
    return res.status(400).json({ message: 'Query parameter q is required.' });
  }
  // Use LIKE for partial matches; adjust columns as needed
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
    res.status(200).json(results);
  });
};
  