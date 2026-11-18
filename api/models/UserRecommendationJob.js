const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserRecommendationJob = sequelize.define('UserRecommendationJob', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
    },
    request_version: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 1
    },
    attempts: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
    },
    available_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    locked_until: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lock_token: {
        type: DataTypes.STRING(36),
        allowNull: true
    },
    last_error: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'user_recommendation_jobs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['status', 'available_at']
        },
        {
            fields: ['status', 'locked_until']
        }
    ]
});

module.exports = UserRecommendationJob;
