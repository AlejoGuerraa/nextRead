const { DataTypes, NOW } = require('sequelize')
const sequelize = require('../config/db')

const Resena = sequelize.define('Resena', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    comentario: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    puntuacion: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },

    likes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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
    
    libro_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'Resenas_Libros'
});

module.exports = Resena