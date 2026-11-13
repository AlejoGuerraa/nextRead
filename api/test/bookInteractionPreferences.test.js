const test = require('node:test');
const assert = require('node:assert/strict');
const { createBookInteractionService } = require('../services/bookInteractionService');

function create_harness() {
    const user = {
        id: 1,
        libros_favoritos: [],
        libros_en_lectura: [],
        libros_para_leer: [],
        libros_leidos: [],
        preferences: null,
        set(field, value) {
            this[field] = value;
        },
        async save() {}
    };
    const book = {
        id: 5,
        tags: ['fantasy'],
        read_count: 0,
        async save() {}
    };
    const states = new Map();
    const reviews = [];
    const events = [];
    const signals = new Map();
    let nextReviewId = 1;
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    const key_for = (userId, bookId) => `${userId}:${bookId}`;

    function make_state(data) {
        const key = key_for(data.user_id, data.book_id);
        const state = {
            ...data,
            async save() {
                states.set(key, this);
            },
            async destroy() {
                states.delete(key);
            }
        };
        states.set(key, state);
        return state;
    }

    function make_review(data) {
        const review = {
            id: nextReviewId++,
            activo: 1,
            ...data,
            async save() {},
            async destroy() {
                const index = reviews.indexOf(this);
                if (index >= 0) reviews.splice(index, 1);
            }
        };
        reviews.push(review);
        return review;
    }

    const sequelize = {
        async transaction(callback) {
            return callback(transaction);
        }
    };
    const Usuario = {
        async findByPk(id) {
            return Number(id) === user.id ? user : null;
        }
    };
    const Libro = {
        async findByPk(id) {
            return Number(id) === book.id ? book : null;
        }
    };
    const UserBookState = {
        async findOne({ where }) {
            return states.get(key_for(where.user_id, where.book_id)) || null;
        },
        async create(data) {
            return make_state(data);
        }
    };
    const BookReadEvent = {
        async create(event) {
            events.push(event);
        }
    };
    const Resena = {
        async findOne({ where }) {
            return reviews
                .filter((review) =>
                    review.usuario_id === where.usuario_id &&
                    review.libro_id === where.libro_id &&
                    (where.activo === undefined || review.activo === where.activo)
                )
                .sort((left, right) => right.id - left.id)[0] || null;
        },
        async findByPk(id) {
            return reviews.find((review) => review.id === Number(id)) || null;
        },
        async create(data) {
            return make_review(data);
        }
    };
    const UserBookPreferenceSignal = {
        async findOne({ where }) {
            const key = key_for(where.user_id, where.book_id);
            const signal = signals.get(key);
            if (!signal) return null;
            return {
                ...signal,
                async save() {
                    signals.set(key, this);
                },
                async destroy() {
                    signals.delete(key);
                }
            };
        },
        async create(data) {
            signals.set(key_for(data.user_id, data.book_id), { ...data });
        }
    };
    const service = createBookInteractionService({
        sequelize,
        Usuario,
        Libro,
        UserBookState,
        BookReadEvent,
        Resena,
        ResenaLike: null,
        RespuestaResena: null,
        UserBookPreferenceSignal
    });

    return { book, events, reviews, service, signals, user };
}

function tag_weight(user) {
    return user.preferences.recommendation.tags.fantasy.weight;
}

test('applies reading-state and favorite transitions once through the interaction service', async () => {
    const { book, events, service, user } = create_harness();

    await service.change_list({ userId: 1, bookId: 5, type: 'leido', action: 'add' });
    assert.equal(book.read_count, 1);
    assert.equal(events.length, 1);
    assert.ok(Math.abs(tag_weight(user) - 0.10) < 1e-10);

    const repeatedRead = await service.change_list({
        userId: 1,
        bookId: 5,
        type: 'leido',
        action: 'add'
    });
    assert.equal(repeatedRead.status, 'already_exists');
    assert.equal(book.read_count, 1);
    assert.equal(events.length, 1);

    await service.change_list({ userId: 1, bookId: 5, type: 'paraLeer', action: 'add' });
    assert.equal(book.read_count, 0);
    assert.equal(events.length, 1);
    assert.ok(Math.abs(tag_weight(user) - 0.15) < 1e-10);

    await service.change_list({ userId: 1, bookId: 5, type: 'favoritos', action: 'add' });
    assert.ok(Math.abs(tag_weight(user) - Math.tanh(Math.atanh(0.15) + Math.atanh(0.30))) < 1e-10);
    await service.change_list({ userId: 1, bookId: 5, type: 'favoritos', action: 'remove' });
    assert.ok(Math.abs(tag_weight(user) - 0.15) < 1e-10);
    await service.change_list({ userId: 1, bookId: 5, type: 'paraLeer', action: 'remove' });
    assert.deepEqual(user.preferences.recommendation.tags, {});
});

test('replaces and removes rating signals without changing reading counts', async () => {
    const { book, events, reviews, service, user } = create_harness();

    await service.change_list({ userId: 1, bookId: 5, type: 'leido', action: 'add' });
    await service.save_rating({ userId: 1, bookId: 5, puntuacion: 5, comentario: '' });
    assert.ok(Math.abs(tag_weight(user) - 0.40) < 1e-10);

    const unchangedRating = await service.save_rating({
        userId: 1,
        bookId: 5,
        puntuacion: 5,
        comentario: ''
    });
    assert.equal(unchangedRating.changed, false);

    await service.save_rating({ userId: 1, bookId: 5, puntuacion: 1, comentario: '' });
    assert.ok(Math.abs(tag_weight(user) + 0.30) < 1e-10);
    await service.delete_review({ userId: 1, reviewId: reviews[0].id });
    assert.ok(Math.abs(tag_weight(user) - 0.10) < 1e-10);
    assert.equal(book.read_count, 1);
    assert.equal(events.length, 1);
});
