const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const Amigo = sequelize.define('Amigo', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    amigo_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
},
{
    timestamps: false,
    tableName: 'Amigo'
});

module.exports = Amigo