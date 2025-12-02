const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Icono = sequelize.define('Icono', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  
  simbolo: {
    type: DataTypes.STRING(255), // guarda el emoji o texto corto
    allowNull: false
  },
},
{
  timestamps: false,
  tableName: 'Icono'
});

module.exports = Icono;