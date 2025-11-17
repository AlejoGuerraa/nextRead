const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const Autor = sequelize.define('Autor', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },

    url_cara: {
        type: DataTypes.STRING(255),
        allowNull: true
    }

},
{
    timestamps: false,
    tableName: 'Autor'
});

module.exports = Autor