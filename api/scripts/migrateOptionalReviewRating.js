const { DataTypes, QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

const tableName = 'Resenas_Libros';
const columnName = 'puntuacion';

async function migrate_optional_review_rating() {
    await sequelize.authenticate();
    const columns = await sequelize.query(
        `SHOW COLUMNS FROM \`${tableName}\` LIKE ?`,
        { replacements: [columnName], type: QueryTypes.SELECT }
    );
    const ratingColumn = columns[0];

    if (!ratingColumn) {
        throw new Error(`Column ${columnName} was not found in ${tableName}.`);
    }

    if (ratingColumn.Null === 'YES') {
        console.log('Review rating is already nullable; no migration needed.');
        return;
    }

    await sequelize.getQueryInterface().changeColumn(tableName, columnName, {
        type: DataTypes.INTEGER,
        allowNull: true,
    });
    console.log('Review rating is now nullable; existing scores were preserved.');
}

migrate_optional_review_rating()
    .catch((error) => {
        console.error('Could not make review ratings optional:', error);
        process.exitCode = 1;
    })
    .finally(() => sequelize.close());
