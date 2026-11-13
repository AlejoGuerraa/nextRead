const LIST_FIELDS = Object.freeze({
    favoritos: 'libros_favoritos',
    enLectura: 'libros_en_lectura',
    paraLeer: 'libros_para_leer',
    leido: 'libros_leidos'
});

const READING_STATUS_BY_LIST = Object.freeze({
    enLectura: 'reading',
    paraLeer: 'to_read',
    leido: 'read'
});

const READING_LISTS = ['enLectura', 'paraLeer', 'leido'];

function normalize_book_ids(value) {
    let list = value;
    if (typeof list === 'string') list = JSON.parse(list);
    if (list == null) return [];
    if (!Array.isArray(list)) return [];

    return [...new Set(list.map((item) => {
        if (typeof item === 'object' && item !== null) {
            if ('idLibro' in item) return Number(item.idLibro);
            if ('id' in item) return Number(item.id);
        }
        return Number(item);
    }).filter((id) => Number.isSafeInteger(id) && id > 0))];
}

function read_user_lists(user) {
    return Object.fromEntries(Object.entries(LIST_FIELDS).map(([type, field]) => [
        field,
        normalize_book_ids(user[field])
    ]));
}

function get_legacy_state(lists, bookId) {
    const statuses = READING_LISTS.filter((type) => lists[LIST_FIELDS[type]].includes(bookId));
    if (statuses.length > 1) {
        const error = new Error(`Conflicting legacy reading states for book ${bookId}`);
        error.code = 'LEGACY_BOOK_STATE_CONFLICT';
        throw error;
    }

    return {
        readingStatus: statuses.length ? READING_STATUS_BY_LIST[statuses[0]] : null,
        isFavorite: lists[LIST_FIELDS.favoritos].includes(bookId)
    };
}

function apply_list_mutation(lists, type, bookId, action) {
    const field = LIST_FIELDS[type];
    if (!field) throw new Error(`Unsupported book list type: ${type}`);
    if (action !== 'add' && action !== 'remove') throw new Error(`Unsupported list action: ${action}`);

    const nextLists = Object.fromEntries(Object.entries(lists).map(([name, ids]) => [name, [...ids]]));
    const oldState = get_legacy_state(lists, bookId);
    const targetIds = nextLists[field];

    if (action === 'add') {
        if (targetIds.includes(bookId)) {
            return { changed: false, alreadyExists: true, lists, oldState, newState: oldState, field };
        }

        if (type === 'favoritos') {
            targetIds.push(bookId);
        } else {
            for (const readingType of READING_LISTS) {
                nextLists[LIST_FIELDS[readingType]] = nextLists[LIST_FIELDS[readingType]].filter((id) => id !== bookId);
            }
            nextLists[field].push(bookId);
        }
    } else {
        if (!targetIds.includes(bookId)) {
            return { changed: false, alreadyExists: false, lists, oldState, newState: oldState, field };
        }
        nextLists[field] = targetIds.filter((id) => id !== bookId);
    }

    const newState = get_legacy_state(nextLists, bookId);
    const changedFields = Object.keys(nextLists).filter((name) => {
        const before = lists[name];
        const after = nextLists[name];
        return before.length !== after.length || before.some((id, index) => id !== after[index]);
    });

    return {
        changed: changedFields.length > 0,
        alreadyExists: false,
        lists: nextLists,
        changedFields,
        oldState,
        newState,
        field
    };
}

function legacy_rows_from_user(user) {
    const lists = read_user_lists(user);
    const bookIds = new Set(Object.values(lists).flat());
    const rows = [];

    for (const bookId of bookIds) {
        const state = get_legacy_state(lists, bookId);
        rows.push({
            user_id: user.id,
            book_id: bookId,
            reading_status: state.readingStatus,
            is_favorite: state.isFavorite,
            status_updated_at: null
        });
    }

    return rows;
}

function createBookInteractionService({
    sequelize,
    Usuario,
    Libro,
    UserBookState,
    BookReadEvent,
    Resena,
    ResenaLike,
    RespuestaResena
}) {
    async function change_list({ userId, bookId, type, action }) {
        return sequelize.transaction(async (transaction) => {
            const user = await Usuario.findByPk(userId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!user) return { status: 'user_not_found' };

            const book = await Libro.findByPk(bookId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!book) return { status: 'book_not_found' };

            const lists = read_user_lists(user);
            const legacyState = get_legacy_state(lists, bookId);
            let state = await UserBookState.findOne({
                where: { user_id: userId, book_id: bookId },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (state && (
                state.reading_status !== legacyState.readingStatus ||
                Boolean(state.is_favorite) !== legacyState.isFavorite
            )) {
                const error = new Error(`User-book state projection mismatch for book ${bookId}`);
                error.code = 'USER_BOOK_STATE_MISMATCH';
                throw error;
            }

            if (!state && (
                legacyState.readingStatus !== null ||
                legacyState.isFavorite ||
                action === 'add'
            )) {
                state = await UserBookState.create({
                    user_id: userId,
                    book_id: bookId,
                    reading_status: legacyState.readingStatus,
                    is_favorite: legacyState.isFavorite,
                    status_updated_at: null
                }, { transaction });
            }

            const mutation = apply_list_mutation(lists, type, bookId, action);
            if (mutation.alreadyExists) {
                return {
                    status: 'already_exists',
                    field: mutation.field,
                    lists
                };
            }
            if (!mutation.changed) {
                return {
                    status: 'ok',
                    changed: false,
                    field: mutation.field,
                    lists
                };
            }

            const readCountDelta = Number(mutation.newState.readingStatus === 'read') -
                Number(mutation.oldState.readingStatus === 'read');
            const nextReadCount = Number(book.read_count) + readCountDelta;
            if (!Number.isSafeInteger(nextReadCount) || nextReadCount < 0) {
                const error = new Error(`Invalid read_count transition for book ${bookId}`);
                error.code = 'INVALID_READ_COUNT';
                throw error;
            }

            if (!state) {
                state = await UserBookState.create({
                    user_id: userId,
                    book_id: bookId,
                    reading_status: null,
                    is_favorite: false,
                    status_updated_at: null
                }, { transaction });
            }

            state.reading_status = mutation.newState.readingStatus;
            state.is_favorite = mutation.newState.isFavorite;
            if (mutation.oldState.readingStatus !== mutation.newState.readingStatus) {
                state.status_updated_at = new Date();
            }

            if (state.reading_status === null && !state.is_favorite) {
                await state.destroy({ transaction });
            } else {
                await state.save({ transaction });
            }

            for (const field of mutation.changedFields) {
                user.set(field, mutation.lists[field]);
            }
            await user.save({ transaction, fields: mutation.changedFields });

            if (readCountDelta !== 0) {
                book.read_count = nextReadCount;
                await book.save({ transaction, fields: ['read_count'] });
            }
            if (readCountDelta > 0) {
                await BookReadEvent.create({
                    user_id: userId,
                    book_id: bookId
                }, { transaction });
            }

            return {
                status: 'ok',
                changed: true,
                field: mutation.field,
                lists: mutation.lists,
                readCountDelta
            };
        });
    }

    async function save_rating({ userId, bookId, puntuacion, comentario }) {
        return sequelize.transaction(async (transaction) => {
            const user = await Usuario.findByPk(userId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!user) return { status: 'user_not_found' };

            const book = await Libro.findByPk(bookId, { transaction });
            if (!book) return { status: 'book_not_found' };

            const review = await Resena.findOne({
                where: { usuario_id: userId, libro_id: bookId },
                order: [['id', 'DESC']],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            const nextComment = comentario || '';
            if (review) {
                const oldScore = Number(review.puntuacion);
                const ratingDelta = puntuacion - oldScore;
                const changed = ratingDelta !== 0 ||
                    review.comentario !== nextComment ||
                    Number(review.activo) !== 1;

                if (changed) {
                    review.puntuacion = puntuacion;
                    review.comentario = nextComment;
                    review.activo = 1;
                    review.fecha = new Date();
                    await review.save({ transaction });
                }

                return { status: 'ok', review, changed, ratingDelta };
            }

            const newReview = await Resena.create({
                usuario_id: userId,
                libro_id: bookId,
                puntuacion,
                comentario: nextComment
            }, { transaction });

            return { status: 'ok', review: newReview, changed: true, ratingDelta: null };
        });
    }

    async function delete_review({ userId, reviewId }) {
        return sequelize.transaction(async (transaction) => {
            const user = await Usuario.findByPk(userId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!user) return { status: 'user_not_found' };

            const review = await Resena.findByPk(reviewId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!review) return { status: 'review_not_found' };
            if (Number(review.usuario_id) !== Number(userId)) return { status: 'forbidden' };

            if (RespuestaResena) {
                await RespuestaResena.destroy({ where: { resena_id: reviewId }, transaction });
            }
            if (ResenaLike) {
                await ResenaLike.destroy({ where: { resena_id: reviewId }, transaction });
            }
            await review.destroy({ transaction });

            return {
                status: 'ok',
                ratingDelta: -Number(review.puntuacion)
            };
        });
    }

    return { change_list, save_rating, delete_review };
}

module.exports = {
    LIST_FIELDS,
    apply_list_mutation,
    createBookInteractionService,
    legacy_rows_from_user,
    normalize_book_ids,
    read_user_lists
};
