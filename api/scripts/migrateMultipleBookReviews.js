const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

const tableName = 'Resenas_Libros';
const reviewColumns = ['libro_id', 'usuario_id'];

async function migrate_multiple_book_reviews() {
    await sequelize.authenticate();
    const indexRows = await sequelize.query(
        `SHOW INDEX FROM \`${tableName}\``,
        { type: QueryTypes.SELECT }
    );
    const indexes = new Map();

    for (const row of indexRows) {
        const index = indexes.get(row.Key_name) || {
            name: row.Key_name,
            unique: Number(row.Non_unique) === 0,
            columns: [],
        };
        index.columns.push(row.Column_name);
        indexes.set(row.Key_name, index);
    }

    const expectedColumns = [...reviewColumns].sort();
    const reviewUniqueIndex = [...indexes.values()].find((index) => (
        index.name !== 'PRIMARY' &&
        index.unique &&
        index.columns.length === expectedColumns.length &&
        [...index.columns].sort().every((column, position) => column === expectedColumns[position])
    ));

    if (!reviewUniqueIndex) {
        console.log('No user/book unique review index found; no migration needed.');
        return;
    }

    const hasUserForeignKeyIndex = [...indexes.values()].some((index) => (
        !index.unique && index.columns[0] === 'usuario_id'
    ));

    if (!hasUserForeignKeyIndex) {
        await sequelize.getQueryInterface().addIndex(
            tableName,
            ['usuario_id'],
            { name: 'Resenas_Libros_usuario_id' }
        );
    }

    await sequelize.getQueryInterface().removeIndex(tableName, reviewUniqueIndex.name);
    console.log(`Removed unique index ${reviewUniqueIndex.name}; reviews can now repeat per user and book.`);
}

migrate_multiple_book_reviews()
    .catch((error) => {
        console.error('Could not migrate multiple book reviews:', error);
        process.exitCode = 1;
    })
    .finally(() => sequelize.close());
