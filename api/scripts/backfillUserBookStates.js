const sequelize = require('../config/db');
const { Op } = require('sequelize');
const { Usuario, UserBookState } = require('../models/indexModel');
const { legacy_rows_from_user } = require('../services/bookInteractionService');

const BATCH_SIZE = 200;

async function backfill_user_book_states() {
    await sequelize.sync({ force: false, alter: false });

    let lastId = 0;
    let migratedUsers = 0;
    let migratedStates = 0;

    while (true) {
        const users = await Usuario.findAll({
            attributes: ['id', 'libros_leidos', 'libros_en_lectura', 'libros_para_leer', 'libros_favoritos'],
            where: { id: { [Op.gt]: lastId } },
            order: [['id', 'ASC']],
            limit: BATCH_SIZE
        });
        if (users.length === 0) break;

        for (const user of users) {
            const rows = legacy_rows_from_user(user);
            if (rows.length) {
                await sequelize.transaction(async (transaction) => {
                    await UserBookState.bulkCreate(rows, {
                        ignoreDuplicates: true,
                        transaction
                    });
                });
            }
            migratedUsers += 1;
            migratedStates += rows.length;
            lastId = user.id;
        }
    }

    await sequelize.query(`
        UPDATE \`Libro\` AS book
        LEFT JOIN (
            SELECT book_id, COUNT(*) AS current_read_count
            FROM \`user_book_states\`
            WHERE reading_status = 'read'
            GROUP BY book_id
        ) AS states ON states.book_id = book.id
        SET book.read_count = COALESCE(states.current_read_count, 0)
    `);

    console.log(`Backfill complete: ${migratedUsers} users checked, ${migratedStates} states processed.`);
}

backfill_user_book_states()
    .catch((error) => {
        console.error('Book-state backfill failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sequelize.close();
    });
