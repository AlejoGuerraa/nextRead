const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Autor = sequelize.define(
  'Autor',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    url_cara: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: 'Autor',
  }
);

module.exports = Autor;