const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserBookState = sequelize.define('UserBookState', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    book_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    reading_status: {
        type: DataTypes.ENUM('reading', 'read', 'to_read'),
        allowNull: true,
        defaultValue: null
    },
    is_favorite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    status_updated_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'user_book_states',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['user_id', 'reading_status', 'status_updated_at']
        },
        {
            fields: ['user_id', 'is_favorite']
        },
        {
            fields: ['book_id', 'reading_status']
        }
    ]
});

module.exports = UserBookState;
