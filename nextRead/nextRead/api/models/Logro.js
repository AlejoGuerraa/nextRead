const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Logro = sequelize.define('Logro', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false
    },

    descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    timestamps: false,
    tableName: 'Logro'
});

module.exports = Logro