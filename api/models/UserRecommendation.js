const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserRecommendation = sequelize.define('UserRecommendation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    generation_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0
    },
    book_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    score: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
            min: -1,
            max: 1
        }
    },
    position: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    is_exploration: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'user_recommendations',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'generation_id', 'book_id']
        },
        {
            unique: true,
            fields: ['user_id', 'generation_id', 'position']
        },
        {
            fields: ['user_id', 'position']
        },
        {
            fields: ['book_id']
        }
    ]
});

module.exports = UserRecommendation;
