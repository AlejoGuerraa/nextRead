const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Banner = sequelize.define('Banner', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  
  url: {
    type: DataTypes.TEXT,
    allowNull: false
  }
},
{
  timestamps: false,
  tableName: 'Banner'
});

module.exports = Banner;