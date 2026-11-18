const sequelize = require('../config/db');
const { create_user_carousel_service } = require('../services/userCarouselService');

const userCarouselService = create_user_carousel_service({ sequelize });

const getHomeContextualCarousels = async (req, res) => {
    try {
        const userId = req.user.id;
        const [
            readingStatusCarousels,
            authorsCarousel,
            moreFromAuthorsCarousel,
            listCarousel,
            readAgainCarousel,
            becauseReadCarousel
        ] = await Promise.all([
            userCarouselService.get_reading_status_carousels(userId),
            userCarouselService.get_recommended_authors(userId),
            userCarouselService.get_more_from_authors(userId),
            userCarouselService.get_random_user_list(userId),
            userCarouselService.get_read_again_carousel(userId),
            userCarouselService.get_because_read_carousel(userId)
        ]);

        const carousels = [
            ...readingStatusCarousels,
            authorsCarousel,
            moreFromAuthorsCarousel,
            listCarousel,
            readAgainCarousel,
            becauseReadCarousel
        ].filter(Boolean);

        return res.json({
            status: 'ready',
            carousels
        });
    } catch (error) {
        console.error('Error loading user and contextual carousels:', error);
        return res.status(500).json({
            message: 'Error al obtener los carruseles de usuario.'
        });
    }
};

module.exports = { getHomeContextualCarousels };
