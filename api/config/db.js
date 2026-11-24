const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Sequelize = require('sequelize');

const requiredVariables = [
    'SQL_DATABASE_NAME',
    'SQL_DATABASE_HOST',
    'SQL_DATABASE_PORT',
    'SQL_DATABASE_USER'
];
const missingVariables = requiredVariables.filter((name) =>
    !process.env[name] || !process.env[name].trim()
);

if (missingVariables.length > 0) {
    throw new Error(
        `Missing database configuration: ${missingVariables.join(', ')}`
    );
}

const port = Number(process.env.SQL_DATABASE_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SQL_DATABASE_PORT must be an integer between 1 and 65535');
}

const database = new Sequelize(
    process.env.SQL_DATABASE_NAME,
    process.env.SQL_DATABASE_USER,
    process.env.SQL_DATABASE_PASSWORD ?? '',
    {
        host: process.env.SQL_DATABASE_HOST,
        port,
        dialect: 'mysql',
        timezone: '+00:00',
        logging: false
    }
);

module.exports = database;