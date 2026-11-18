const DEFAULTS = Object.freeze({
    debounceMs: 4000,
    pollIntervalMs: 1000,
    batchSize: 5,
    concurrency: 2,
    leaseMs: 300000,
    maxAttempts: 5,
    retryBaseMs: 5000,
    retryMaxMs: 300000
});

function read_integer(name, fallback, { minimum = 1, maximum = Number.MAX_SAFE_INTEGER } = {}) {
    const rawValue = process.env[name];
    if (rawValue === undefined || rawValue === '') return fallback;

    const value = Number(rawValue);
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
        throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
    }
    return value;
}

function get_recommendation_worker_config() {
    const config = {
        debounceMs: read_integer('RECOMMENDATION_JOB_DEBOUNCE_MS', DEFAULTS.debounceMs, { minimum: 0, maximum: 300000 }),
        pollIntervalMs: read_integer('RECOMMENDATION_WORKER_POLL_INTERVAL_MS', DEFAULTS.pollIntervalMs, { maximum: 60000 }),
        batchSize: read_integer('RECOMMENDATION_WORKER_BATCH_SIZE', DEFAULTS.batchSize, { maximum: 100 }),
        concurrency: read_integer('RECOMMENDATION_WORKER_CONCURRENCY', DEFAULTS.concurrency, { maximum: 20 }),
        leaseMs: read_integer('RECOMMENDATION_WORKER_LEASE_MS', DEFAULTS.leaseMs, { minimum: 1000, maximum: 3600000 }),
        maxAttempts: read_integer('RECOMMENDATION_JOB_MAX_ATTEMPTS', DEFAULTS.maxAttempts, { maximum: 20 }),
        retryBaseMs: read_integer('RECOMMENDATION_JOB_RETRY_BASE_MS', DEFAULTS.retryBaseMs, { maximum: 86400000 }),
        retryMaxMs: read_integer('RECOMMENDATION_JOB_RETRY_MAX_MS', DEFAULTS.retryMaxMs, { maximum: 86400000 })
    };

    if (config.retryMaxMs < config.retryBaseMs) {
        throw new Error('RECOMMENDATION_JOB_RETRY_MAX_MS must be greater than or equal to the retry base');
    }
    return config;
}

module.exports = { get_recommendation_worker_config };
