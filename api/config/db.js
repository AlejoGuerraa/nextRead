require('dotenv').config();
const Sequelize = require('sequelize');

const database = new Sequelize(
    process.env.SQL_DATABASE_NAME || 'nextread',
    process.env.SQL_DATABASE_USER || 'root',
    process.env.SQL_DATABASE_PASSWORD || '',
    {
        host: process.env.SQL_DATABASE_HOST || 'localhost',
        port: Number(process.env.SQL_DATABASE_PORT || 3306),
        dialect: 'mysql',
        logging: false
    }
);

module.exports = database;