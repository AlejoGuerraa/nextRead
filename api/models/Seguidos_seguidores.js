const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Seguidos_seguidores = sequelize.define('Seguidos_seguidores', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    id_remitente: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    id_destinatario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    estado: {
        type: DataTypes.ENUM('enviado', 'aceptado', 'rechazado'),
    }
}, {
    timestamps: false,
    tableName: 'Seguidos_Seguidores'
});

module.exports = Seguidos_seguidores;