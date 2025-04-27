const sequelize = require('../config/db');
const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const Coupon = require('./Coupon');
const Category = require('./Category');
const SubCategory = require('./SubCategory');
const Message = require('./Message');

// Associations
Category.hasMany(SubCategory, { as: 'subs' });
SubCategory.belongsTo(Category);

Product.belongsTo(Category);
Product.belongsTo(SubCategory);
User.hasMany(Order);
Order.belongsTo(User);
Order.belongsToMany(Product, { through: 'OrderItems' });
Product.belongsToMany(Order, { through: 'OrderItems' });
User.hasMany(Coupon, { as: 'redeemedCoupons' });

module.exports = {
  sequelize,
  User,
  Product,
  Order,
  Coupon,
  Category,
  SubCategory,
  Message
};
