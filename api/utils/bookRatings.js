const { Sequelize } = require('sequelize');
const Resena = require('../models/Resena');

async function attach_average_ratings(books) {
    if (!Array.isArray(books) || books.length === 0) return [];

    const normalizedBooks = books.map((book) => (
        typeof book.toJSON === 'function' ? book.toJSON() : { ...book }
    ));
    const bookIds = [...new Set(normalizedBooks
        .map((book) => Number(book.id))
        .filter((id) => Number.isInteger(id) && id > 0))];

    if (bookIds.length === 0) {
        return normalizedBooks.map((book) => ({ ...book, average_rating: null }));
    }

    const ratings = await Resena.findAll({
        attributes: [
            'libro_id',
            [Sequelize.fn('AVG', Sequelize.col('puntuacion')), 'average_rating'],
        ],
        where: { libro_id: bookIds, activo: 1 },
        group: ['libro_id'],
        raw: true,
    });

    const ratingsByBookId = new Map(ratings.map((rating) => {
        const average = Number(rating.average_rating);
        return [
            Number(rating.libro_id),
            Number.isFinite(average) && average >= 1 && average <= 5 ? average : null,
        ];
    }));

    return normalizedBooks.map((book) => ({
        ...book,
        average_rating: ratingsByBookId.get(Number(book.id)) ?? null,
    }));
}

module.exports = { attach_average_ratings };
