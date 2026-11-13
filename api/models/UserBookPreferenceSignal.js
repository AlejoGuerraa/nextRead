const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserBookPreferenceSignal = sequelize.define('UserBookPreferenceSignal', {
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
    contributions: {
        type: DataTypes.JSON,
        allowNull: false
    }
}, {
    tableName: 'user_book_preference_signals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['book_id', 'user_id']
        }
    ]
});

module.exports = UserBookPreferenceSignal;
