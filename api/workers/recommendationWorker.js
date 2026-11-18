const logger = require('../utils/logger');
const sequelize = require('../config/db');
const models = require('../models/indexModel');
const { create_recommendation_service } = require('../services/recommendationService');
const { create_recommendation_job_service } = require('../services/recommendationJobService');
const { create_recommendation_worker } = require('../services/recommendationWorkerService');
const { create_recommendation_generation_lock } = require('../services/recommendationGenerationLock');
const { get_recommendation_worker_config } = require('../config/recommendationWorker');

async function start_worker() {
    const config = get_recommendation_worker_config();
    const poolMax = Number(sequelize.options.pool?.max || 5);
    const concurrency = Math.min(config.concurrency, poolMax - 1);
    if (concurrency < 1) {
        throw new Error('The Sequelize pool must allow at least two connections for recommendation locking and queries');
    }
    if (concurrency < config.concurrency) {
        logger.warn('Recommendation worker concurrency was limited to preserve a query connection', {
            configuredConcurrency: config.concurrency,
            effectiveConcurrency: concurrency,
            poolMax
        });
    }
    await sequelize.authenticate();

    const jobService = create_recommendation_job_service({
        sequelize,
        UserRecommendationJob: models.UserRecommendationJob,
        ...config
    });
    const recommendationService = create_recommendation_service({
        sequelize,
        Usuario: models.Usuario,
        UserRecommendation: models.UserRecommendation
    });
    const generationLock = create_recommendation_generation_lock({ sequelize });
    const worker = create_recommendation_worker({
        jobService,
        recommendationService,
        generationLock,
        ...config,
        concurrency,
        logger
    });

    let stopping = false;
    const shutdown = async (signal) => {
        if (stopping) return;
        stopping = true;
        logger.info('Stopping recommendation worker', { signal });
        try {
            await worker.stop();
            await sequelize.close();
            process.exitCode = 0;
        } catch (error) {
            logger.error('Failed to stop recommendation worker cleanly', error);
            process.exitCode = 1;
        }
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    logger.info('Recommendation worker started', {
        pollIntervalMs: config.pollIntervalMs,
        batchSize: config.batchSize,
        concurrency
    });
    await worker.start();
    if (!stopping) await sequelize.close();
}

if (require.main === module) {
    start_worker().catch(async (error) => {
        logger.error('Recommendation worker could not start', error);
        process.exitCode = 1;
        await sequelize.close();
    });
}

module.exports = { start_worker };
