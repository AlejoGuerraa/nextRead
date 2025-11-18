const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Usuario_Logro = sequelize.define('Usuario_Logro', {
    usuario_id: {
        type: DataTypes.SMALLINT,
        allowNull: false
    },

    logro_id: {
        type: DataTypes.SMALLINT,
        allowNull: false
    },

    fecha_obtenido: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },

}, {
    timestamps: false,
    tableName: 'Usuario_Logro'
});

module.exports = Usuario_Logro