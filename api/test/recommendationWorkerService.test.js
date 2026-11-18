const test = require('node:test');
const assert = require('node:assert/strict');
const { create_recommendation_worker } = require('../services/recommendationWorkerService');

function create_logger() {
    return {
        errors: [],
        infos: [],
        warns: [],
        error(...args) { this.errors.push(args); },
        info(...args) { this.infos.push(args); },
        warn(...args) { this.warns.push(args); }
    };
}

test('processes separate users concurrently and records a generation failure for retry', async () => {
    const logger = create_logger();
    const claimed = [
        { user_id: 1, request_version: '1', attempts: 1, lock_token: 'a' },
        { user_id: 2, request_version: '1', attempts: 1, lock_token: 'b' }
    ];
    const failed = [];
    const completed = [];
    let active = 0;
    let maximumActive = 0;
    const worker = create_recommendation_worker({
        jobService: {
            async claim_jobs() { return claimed; },
            async renew_lease() { return true; },
            async complete_job(job) {
                completed.push(job.user_id);
                return { status: 'completed' };
            },
            async fail_job(job, error) {
                failed.push({ userId: job.user_id, error });
                return { status: 'pending' };
            }
        },
        generationLock: {
            async with_user_lock(_userId, callback) {
                return { acquired: true, value: await callback() };
            }
        },
        recommendationService: {
            async generate_for_user(userId) {
                active += 1;
                maximumActive = Math.max(maximumActive, active);
                await new Promise((resolve) => setTimeout(resolve, 10));
                active -= 1;
                if (userId === 2) throw new Error('Temporary generation failure');
                return { recommendations: [{ book_id: 10 }] };
            }
        },
        batchSize: 5,
        concurrency: 2,
        leaseMs: 3000,
        logger
    });

    const processed = await worker.run_once();

    assert.equal(processed, 2);
    assert.equal(maximumActive, 2);
    assert.deepEqual(completed, [1]);
    assert.equal(failed.length, 1);
    assert.equal(failed[0].userId, 2);
    assert.match(failed[0].error.message, /Temporary generation failure/);
    assert.equal(logger.errors.length, 1);
});

test('stop wakes a worker waiting between polls', async () => {
    let pollCount = 0;
    const worker = create_recommendation_worker({
        jobService: {
            async claim_jobs() {
                pollCount += 1;
                return [];
            }
        },
        generationLock: {
            async with_user_lock(_userId, callback) {
                return { acquired: true, value: await callback() };
            }
        },
        recommendationService: { async generate_for_user() {} },
        pollIntervalMs: 60000,
        batchSize: 1,
        concurrency: 1,
        logger: create_logger()
    });

    const run = worker.start();
    while (pollCount === 0) await new Promise((resolve) => setTimeout(resolve, 1));
    await worker.stop();
    await run;

    assert.equal(pollCount, 1);
});

test('defers work without generating when another worker owns the user lock', async () => {
    let generated = false;
    let deferred = 0;
    const logger = create_logger();
    const worker = create_recommendation_worker({
        jobService: {
            async claim_jobs() {
                return [{ user_id: 5, request_version: '1', attempts: 1, lock_token: 'worker-lock' }];
            },
            async renew_lease() { return true; },
            async defer_job(job, delayMs) {
                deferred += 1;
                assert.equal(job.user_id, 5);
                assert.equal(delayMs, 250);
                return true;
            }
        },
        generationLock: {
            async with_user_lock() {
                return { acquired: false };
            }
        },
        recommendationService: {
            async generate_for_user() { generated = true; }
        },
        pollIntervalMs: 250,
        batchSize: 1,
        concurrency: 1,
        leaseMs: 3000,
        logger
    });

    await worker.run_once();

    assert.equal(generated, false);
    assert.equal(deferred, 1);
    assert.equal(logger.warns.length, 1);
});
