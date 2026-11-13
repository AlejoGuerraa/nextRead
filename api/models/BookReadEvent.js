const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BookReadEvent = sequelize.define('BookReadEvent', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    book_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    occurred_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'book_read_events',
    timestamps: false,
    indexes: [
        {
            fields: ['occurred_at', 'book_id', 'user_id']
        },
        {
            fields: ['user_id', 'book_id', 'occurred_at']
        }
    ]
});

module.exports = BookReadEvent;
