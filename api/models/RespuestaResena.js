const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RespuestaResena = sequelize.define('RespuestaResena', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  activo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  resena_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false,
  tableName: 'Resenas_Respuestas',
  indexes: [
    { fields: ['resena_id', 'fecha'] }
  ]
});

module.exports = RespuestaResena;