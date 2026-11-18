function create_recommendation_worker({
    jobService,
    recommendationService,
    generationLock,
    pollIntervalMs = 1000,
    batchSize = 5,
    concurrency = 2,
    leaseMs = 300000,
    logger = console
}) {
    if (!generationLock || typeof generationLock.with_user_lock !== 'function') {
        throw new TypeError('A MySQL recommendation generation lock is required');
    }

    let stopping = false;
    let loopPromise = null;
    let timer = null;
    let wakeTimer = null;

    async function process_job(job) {
        const startedAt = Date.now();
        const heartbeatInterval = Math.max(250, Math.floor(leaseMs / 3));
        const heartbeat = setInterval(() => {
            jobService.renew_lease(job, leaseMs).then((renewed) => {
                if (!renewed) {
                    logger.warn('Recommendation job lease is no longer owned', {
                        userId: job.user_id
                    });
                }
            }).catch((error) => {
                logger.error('Failed to renew recommendation job lease', error);
            });
        }, heartbeatInterval);
        if (typeof heartbeat.unref === 'function') heartbeat.unref();

        try {
            const lockedGeneration = await generationLock.with_user_lock(job.user_id, async () => {
                const result = await recommendationService.generate_for_user(job.user_id);
                const completion = await jobService.complete_job(job);
                return { result, completion };
            });
            if (!lockedGeneration.acquired) {
                await jobService.defer_job(job, pollIntervalMs);
                logger.warn('Recommendation generation already active for user', {
                    userId: job.user_id
                });
                return;
            }
            const { result, completion } = lockedGeneration.value;
            logger.info('Recommendation job processed', {
                userId: job.user_id,
                status: completion.status || 'lease_lost',
                recommendationCount: result.recommendations.length,
                durationMs: Date.now() - startedAt
            });
        } catch (error) {
            const outcome = await jobService.fail_job(job, error);
            logger.error(
                `Recommendation job failed for user ${job.user_id} ` +
                `(attempt ${job.attempts}, status ${outcome.status || 'lease_lost'}, ` +
                `duration ${Date.now() - startedAt}ms)`,
                error
            );
        } finally {
            clearInterval(heartbeat);
        }
    }

    async function run_once() {
        const limit = Math.min(batchSize, concurrency);
        const jobs = await jobService.claim_jobs({ limit, leaseMs });
        await Promise.all(jobs.map(process_job));
        return jobs.length;
    }

    function wait_for_next_poll() {
        return new Promise((resolve) => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                timer = null;
                wakeTimer = null;
                resolve();
            };
            wakeTimer = finish;
            timer = setTimeout(finish, pollIntervalMs);
        });
    }

    async function run() {
        while (!stopping) {
            try {
                await run_once();
            } catch (error) {
                logger.error('Recommendation worker poll failed', error);
            }
            if (!stopping) await wait_for_next_poll();
        }
    }

    function start() {
        if (!loopPromise) {
            stopping = false;
            loopPromise = run();
        }
        return loopPromise;
    }

    async function stop() {
        stopping = true;
        if (timer) clearTimeout(timer);
        if (wakeTimer) wakeTimer();
        if (loopPromise) {
            await loopPromise;
            loopPromise = null;
        }
    }

    return { run_once, start, stop };
}

module.exports = { create_recommendation_worker };
