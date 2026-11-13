const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');
require('../models/indexModel');

const RECOMMENDATION_INDEXES = [
    {
        name: 'uq_user_recommendations_generation_book',
        columns: ['user_id', 'generation_id', 'book_id'],
        unique: true
    },
    {
        name: 'uq_user_recommendations_generation_position',
        columns: ['user_id', 'generation_id', 'position'],
        unique: true
    },
    {
        name: 'idx_user_recommendations_user_position',
        columns: ['user_id', 'position'],
        unique: false
    },
    {
        name: 'idx_user_recommendations_book',
        columns: ['book_id'],
        unique: false
    }
];

function supports_multi_valued_indexes(version, versionComment = '') {
    if (/mariadb/i.test(`${version} ${versionComment}`)) return false;
    const match = String(version).match(/(\d+)\.(\d+)\.(\d+)/);
    if (!match) return false;

    const [major, minor, patch] = match.slice(1).map(Number);
    return major > 8 || (major === 8 && (minor > 0 || (minor === 0 && patch >= 17)));
}

function has_index(rows, expectedColumns, requireUnique) {
    const indexes = new Map();
    for (const row of rows) {
        if (!indexes.has(row.Key_name)) indexes.set(row.Key_name, []);
        indexes.get(row.Key_name).push(row);
    }

    return [...indexes.values()].some((indexRows) => {
        const orderedColumns = indexRows
            .sort((left, right) => Number(left.Seq_in_index) - Number(right.Seq_in_index))
            .map((row) => row.Column_name);
        const isUnique = Number(indexRows[0].Non_unique) === 0;
        return isUnique === requireUnique &&
            orderedColumns.length === expectedColumns.length &&
            orderedColumns.every((column, index) => column === expectedColumns[index]);
    });
}

async function ensure_generation_column() {
    const columns = await sequelize.query(
        'SHOW COLUMNS FROM `user_recommendations`',
        { type: QueryTypes.SELECT }
    );
    if (columns.some((column) => column.Field === 'generation_id')) return;

    await sequelize.query(`
        ALTER TABLE \`user_recommendations\`
        ADD COLUMN \`generation_id\` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER \`user_id\`
    `);
}

async function ensure_exploration_column() {
    const columns = await sequelize.query(
        'SHOW COLUMNS FROM `user_recommendations`',
        { type: QueryTypes.SELECT }
    );
    if (columns.some((column) => column.Field === 'is_exploration')) return;

    await sequelize.query(`
        ALTER TABLE \`user_recommendations\`
        ADD COLUMN \`is_exploration\` BOOLEAN NOT NULL DEFAULT FALSE
    `);
}

async function ensure_recommendation_indexes() {
    const indexes = await sequelize.query(
        'SHOW INDEX FROM `user_recommendations`',
        { type: QueryTypes.SELECT }
    );
    for (const index of RECOMMENDATION_INDEXES) {
        if (has_index(indexes, index.columns, index.unique)) continue;
        const columns = index.columns.map((column) => `\`${column}\``).join(', ');
        const unique = index.unique ? 'UNIQUE ' : '';
        await sequelize.query(
            `CREATE ${unique}INDEX \`${index.name}\` ON \`user_recommendations\` (${columns})`
        );
    }
}

async function ensure_book_tag_index() {
    const indexes = await sequelize.query(
        'SHOW INDEX FROM `Libro`',
        { type: QueryTypes.SELECT }
    );
    if (indexes.some((index) => index.Key_name === 'idx_libro_tags_mvi')) return;

    await sequelize.query(`
        CREATE INDEX \`idx_libro_tags_mvi\`
        ON \`Libro\` ((CAST(\`tags\` AS CHAR(255) ARRAY)))
    `);
}

async function assert_supported_mysql_version() {
    const [server] = await sequelize.query(
        'SELECT VERSION() AS version, @@version_comment AS version_comment',
        { type: QueryTypes.SELECT }
    );
    if (!server || !supports_multi_valued_indexes(server.version, server.version_comment)) {
        throw new Error(
            'The recommendation tag index requires Oracle MySQL 8.0.17 or newer; MariaDB is not supported.'
        );
    }
}

async function migrate_recommendation_schema() {
    await assert_supported_mysql_version();
    await sequelize.sync({ force: false, alter: false });
    await ensure_generation_column();
    await ensure_exploration_column();
    await ensure_recommendation_indexes();
    await ensure_book_tag_index();
    console.log('Recommendation schema migration complete.');
}

if (require.main === module) {
    migrate_recommendation_schema()
        .catch((error) => {
            console.error('Recommendation schema migration failed:', error);
            process.exitCode = 1;
        })
        .finally(async () => {
            await sequelize.close();
        });
}

module.exports = {
    has_index,
    supports_multi_valued_indexes
};
