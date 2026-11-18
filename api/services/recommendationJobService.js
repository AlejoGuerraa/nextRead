const { Op } = require('sequelize');
const { randomUUID } = require('node:crypto');

const ENQUEUE_SQL = `
    INSERT INTO \`user_recommendation_jobs\`
        (\`user_id\`, \`status\`, \`request_version\`, \`attempts\`, \`available_at\`,
         \`locked_until\`, \`lock_token\`, \`last_error\`, \`created_at\`, \`updated_at\`)
    VALUES
        (:userId, 'pending', 1, 0,
         DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL :debounceMicroseconds MICROSECOND),
         NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    ON DUPLICATE KEY UPDATE
        \`request_version\` = \`request_version\` + 1,
        \`available_at\` = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL :debounceMicroseconds MICROSECOND),
        \`status\` = IF(\`status\` = 'processing', 'processing', 'pending'),
        \`attempts\` = 0,
        \`locked_until\` = IF(\`status\` = 'processing', \`locked_until\`, NULL),
        \`lock_token\` = IF(\`status\` = 'processing', \`lock_token\`, NULL),
        \`last_error\` = NULL,
        \`updated_at\` = CURRENT_TIMESTAMP(3)
`;

const INITIAL_ENQUEUE_SQL = `
    INSERT IGNORE INTO \`user_recommendation_jobs\`
        (\`user_id\`, \`status\`, \`request_version\`, \`attempts\`, \`available_at\`,
         \`locked_until\`, \`lock_token\`, \`last_error\`, \`created_at\`, \`updated_at\`)
    VALUES
        (:userId, 'pending', 1, 0,
         DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL :debounceMicroseconds MICROSECOND),
         NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
`;

function normalize_user_id(userId) {
    const normalized = Number(userId);
    if (!Number.isSafeInteger(normalized) || normalized <= 0) {
        throw new TypeError('A positive safe user ID is required');
    }
    return normalized;
}

function to_job_snapshot(job) {
    return {
        user_id: Number(job.user_id),
        request_version: String(job.request_version),
        attempts: Number(job.attempts),
        lock_token: job.lock_token
    };
}

function format_error(error) {
    const name = error && error.name ? String(error.name) : 'Error';
    const message = error && error.message ? String(error.message) : String(error);
    return `${name}: ${message}`.slice(0, 1000);
}

function create_recommendation_job_service({
    sequelize,
    UserRecommendationJob,
    debounceMs = 4000,
    maxAttempts = 5,
    retryBaseMs = 5000,
    retryMaxMs = 300000,
    now = () => new Date(),
    createLockToken = randomUUID
}) {
    const debounceMicroseconds = debounceMs * 1000;

    async function enqueue_for_user(userId, transaction) {
        await sequelize.query(ENQUEUE_SQL, {
            replacements: {
                userId: normalize_user_id(userId),
                debounceMicroseconds
            },
            ...(transaction ? { transaction } : {})
        });
    }

    async function enqueue_initial(userId) {
        await sequelize.query(INITIAL_ENQUEUE_SQL, {
            replacements: {
                userId: normalize_user_id(userId),
                debounceMicroseconds
            }
        });
    }

    async function get_status(userId) {
        const job = await UserRecommendationJob.findByPk(normalize_user_id(userId), {
            attributes: ['status', 'last_error']
        });
        return job ? { status: job.status, last_error: job.last_error } : null;
    }

    async function claim_jobs({ limit, leaseMs }) {
        return sequelize.transaction(async (transaction) => {
            const currentTime = now();
            const jobs = await UserRecommendationJob.findAll({
                where: {
                    [Op.or]: [
                        { status: 'pending', available_at: { [Op.lte]: currentTime } },
                        { status: 'processing', locked_until: { [Op.lte]: currentTime } }
                    ]
                },
                order: [['available_at', 'ASC'], ['user_id', 'ASC']],
                limit,
                transaction,
                lock: transaction.LOCK.UPDATE,
                skipLocked: true
            });

            const claimed = [];
            for (const job of jobs) {
                if (job.status === 'processing' && Number(job.attempts) >= maxAttempts) {
                    job.status = 'failed';
                    job.lock_token = null;
                    job.locked_until = null;
                    job.last_error = 'Worker lease expired after the maximum number of attempts';
                    await job.save({
                        transaction,
                        fields: ['status', 'lock_token', 'locked_until', 'last_error']
                    });
                    continue;
                }

                job.status = 'processing';
                job.attempts = Number(job.attempts) + 1;
                job.lock_token = createLockToken();
                job.locked_until = new Date(currentTime.getTime() + leaseMs);
                await job.save({
                    transaction,
                    fields: ['status', 'attempts', 'lock_token', 'locked_until']
                });
                claimed.push(to_job_snapshot(job));
            }
            return claimed;
        });
    }

    async function renew_lease(job, leaseMs) {
        const [updatedCount] = await UserRecommendationJob.update({
            locked_until: new Date(now().getTime() + leaseMs)
        }, {
            where: {
                user_id: job.user_id,
                status: 'processing',
                lock_token: job.lock_token
            }
        });
        return updatedCount === 1;
    }

    async function defer_job(job, delayMs) {
        return sequelize.transaction(async (transaction) => {
            const current = await UserRecommendationJob.findByPk(job.user_id, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!owns_job(current, job)) return false;

            current.status = 'pending';
            current.attempts = String(current.request_version) === job.request_version
                ? Math.max(0, Number(current.attempts) - 1)
                : 0;
            current.available_at = new Date(now().getTime() + delayMs);
            current.lock_token = null;
            current.locked_until = null;
            current.last_error = null;
            await current.save({ transaction });
            return true;
        });
    }

    async function complete_job(job) {
        return sequelize.transaction(async (transaction) => {
            const current = await UserRecommendationJob.findByPk(job.user_id, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!owns_job(current, job)) return { owned: false };

            current.lock_token = null;
            current.locked_until = null;
            current.last_error = null;
            if (String(current.request_version) !== job.request_version) {
                current.status = 'pending';
                current.attempts = 0;
                await current.save({ transaction });
                return { owned: true, status: 'pending', superseded: true };
            }

            current.status = 'completed';
            await current.save({ transaction });
            return { owned: true, status: 'completed', superseded: false };
        });
    }

    async function fail_job(job, error) {
        return sequelize.transaction(async (transaction) => {
            const current = await UserRecommendationJob.findByPk(job.user_id, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!owns_job(current, job)) return { owned: false };

            current.lock_token = null;
            current.locked_until = null;
            current.last_error = format_error(error);

            if (String(current.request_version) !== job.request_version) {
                current.status = 'pending';
                current.attempts = 0;
                current.last_error = null;
                await current.save({ transaction });
                return { owned: true, status: 'pending', superseded: true };
            }

            if (Number(current.attempts) >= maxAttempts) {
                current.status = 'failed';
                await current.save({ transaction });
                return { owned: true, status: 'failed', superseded: false };
            }

            const retryDelay = Math.min(
                retryBaseMs * (2 ** Math.max(0, Number(current.attempts) - 1)),
                retryMaxMs
            );
            current.status = 'pending';
            current.available_at = new Date(now().getTime() + retryDelay);
            await current.save({ transaction });
            return { owned: true, status: 'pending', superseded: false };
        });
    }

    function owns_job(current, job) {
        return current &&
            current.status === 'processing' &&
            current.lock_token === job.lock_token;
    }

    return {
        claim_jobs,
        complete_job,
        defer_job,
        enqueue_for_user,
        enqueue_initial,
        fail_job,
        get_status,
        renew_lease
    };
}

module.exports = {
    create_recommendation_job_service,
    ENQUEUE_SQL,
    INITIAL_ENQUEUE_SQL
};
