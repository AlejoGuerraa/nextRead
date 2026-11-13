const sequelize = require('../config/db');
const { Op } = require('sequelize');
const {
    Usuario,
    Libro,
    UserBookState,
    Resena,
    UserBookPreferenceSignal
} = require('../models/indexModel');
const {
    build_book_contributions,
    build_initial_preferences,
    parse_preferences
} = require('../services/tagPreferenceService');
const { legacy_rows_from_user } = require('../services/bookInteractionService');

const BATCH_SIZE = 100;

function pair_key(userId, bookId) {
    return `${userId}:${bookId}`;
}

async function backfill_user_tag_preferences() {
    await sequelize.sync({ force: false, alter: false });

    let lastId = 0;
    let migratedUsers = 0;
    let migratedSignals = 0;

    while (true) {
        const users = await Usuario.findAll({
            attributes: [
                'id',
                'preferences',
                'libros_leidos',
                'libros_en_lectura',
                'libros_para_leer',
                'libros_favoritos'
            ],
            where: { id: { [Op.gt]: lastId } },
            order: [['id', 'ASC']],
            limit: BATCH_SIZE
        });
        if (users.length === 0) break;

        const userIds = users.map((user) => user.id);
        const states = await UserBookState.findAll({
            where: { user_id: { [Op.in]: userIds } },
            attributes: ['user_id', 'book_id', 'reading_status', 'is_favorite']
        });
        const actualStatesByUser = new Map();
        for (const state of states) {
            if (!actualStatesByUser.has(Number(state.user_id))) {
                actualStatesByUser.set(Number(state.user_id), new Map());
            }
            actualStatesByUser.get(Number(state.user_id)).set(pair_key(state.user_id, state.book_id), {
                readingStatus: state.reading_status,
                isFavorite: Boolean(state.is_favorite)
            });
        }
        for (const user of users) {
            const expectedStates = new Map(legacy_rows_from_user(user).map((state) => [
                pair_key(state.user_id, state.book_id),
                {
                    readingStatus: state.reading_status,
                    isFavorite: Boolean(state.is_favorite)
                }
            ]));
            const actualStates = actualStatesByUser.get(Number(user.id)) || new Map();
            const stateKeys = new Set([
                ...expectedStates.keys(),
                ...actualStates.keys()
            ]);
            for (const key of stateKeys) {
                const expected = expectedStates.get(key) || { readingStatus: null, isFavorite: false };
                const actual = actualStates.get(key) || { readingStatus: null, isFavorite: false };
                if (
                    expected.readingStatus !== actual.readingStatus ||
                    expected.isFavorite !== actual.isFavorite
                ) {
                    throw new Error(
                        `User-book state backfill is incomplete or inconsistent for ${key}; run migrate:book-states first`
                    );
                }
            }
        }
        const reviews = await Resena.findAll({
            where: { usuario_id: { [Op.in]: userIds }, activo: 1 },
            attributes: ['id', 'usuario_id', 'libro_id', 'puntuacion'],
            order: [['id', 'DESC']]
        });

        const booksById = new Map();
        const bookIds = new Set([
            ...states.map((state) => state.book_id),
            ...reviews.map((review) => review.libro_id)
        ]);
        if (bookIds.size > 0) {
            const books = await Libro.findAll({
                where: { id: { [Op.in]: [...bookIds] } },
                attributes: ['id', 'tags']
            });
            for (const book of books) booksById.set(book.id, book);
        }

        const sourcesByPair = new Map();
        const ratedPairs = new Set();
        for (const state of states) {
            sourcesByPair.set(pair_key(state.user_id, state.book_id), {
                readingStatus: state.reading_status,
                isFavorite: Boolean(state.is_favorite),
                rating: null
            });
        }
        for (const review of reviews) {
            const key = pair_key(review.usuario_id, review.libro_id);
            if (ratedPairs.has(key)) continue;
            const sources = sourcesByPair.get(key) || {
                readingStatus: null,
                isFavorite: false,
                rating: null
            };
            sources.rating = Number(review.puntuacion);
            sourcesByPair.set(key, sources);
            ratedPairs.add(key);
        }

        const sourcePairsByUser = new Map();
        for (const [key, sources] of sourcesByPair) {
            const [userId, bookId] = key.split(':').map(Number);
            if (!sourcePairsByUser.has(userId)) sourcePairsByUser.set(userId, []);
            sourcePairsByUser.get(userId).push({ bookId, sources });
        }

        for (const user of users) {
            const contributionsByBook = new Map();
            for (const { bookId, sources } of sourcePairsByUser.get(Number(user.id)) || []) {
                const book = booksById.get(bookId);
                if (!book) continue;

                const contributions = build_book_contributions(book.tags, sources);
                if (Object.keys(contributions).length > 0) {
                    contributionsByBook.set(bookId, contributions);
                }
            }

            const now = new Date();
            const initial = build_initial_preferences(contributionsByBook, now);
            const migrated = await sequelize.transaction(async (transaction) => {
                const lockedUser = await Usuario.findByPk(user.id, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (!lockedUser) return false;

                const currentPreferences = parse_preferences(lockedUser.preferences);
                const currentRecommendation = currentPreferences.recommendation || {};
                if (currentRecommendation.signals_initialized) return false;

                await UserBookPreferenceSignal.destroy({
                    where: { user_id: user.id },
                    transaction
                });
                if (initial.rows.length > 0) {
                    await UserBookPreferenceSignal.bulkCreate(initial.rows.map((row) => ({
                        user_id: user.id,
                        book_id: row.book_id,
                        contributions: row.contributions
                    })), { transaction });
                }

                lockedUser.preferences = {
                    ...currentPreferences,
                    recommendation: {
                        ...currentRecommendation,
                        tags: initial.tags,
                        signals_initialized: true
                    }
                };
                await lockedUser.save({ transaction, fields: ['preferences'] });
                return true;
            });

            migratedUsers += 1;
            if (migrated) migratedSignals += initial.rows.length;
            lastId = user.id;
        }
    }

    console.log(`Tag preference backfill complete: ${migratedUsers} users checked, ${migratedSignals} book signals processed.`);
}

backfill_user_tag_preferences()
    .catch((error) => {
        console.error('Tag preference backfill failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sequelize.close();
    });
