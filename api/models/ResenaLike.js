const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ResenaLike = sequelize.define('ResenaLike', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  resena_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false,
  tableName: 'Resenas_Likes',
  indexes: [
    {
      unique: true,
      fields: ['resena_id', 'usuario_id']
    }
  ]
});

module.exports = ResenaLike;
