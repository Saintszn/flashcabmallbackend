// backend/models/Message.js

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db'); // your configured sequelize instance

class Message extends Model {}

Message.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  chatUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',         // name of the Users table
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  text: {
    type: DataTypes.TEXT,     // arbitrary-length message content
    allowNull: true
  },
  fileUrl: {
    type: DataTypes.STRING,   // path to any attachment (image, video, doc)
    allowNull: true
  },
  fromAdmin: {
    type: DataTypes.BOOLEAN,  // admin vs. user flag
    allowNull: false,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'Message',
  tableName: 'Messages',
  timestamps: true,           // adds createdAt & updatedAt automatically
  createdAt: 'createdAt',     // maps to our DATETIME createdAt column
  updatedAt: false            // disable updatedAt if not needed (or set to true to create an updatedAt column)
});

module.exports = Message;
