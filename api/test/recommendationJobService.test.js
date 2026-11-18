const test = require('node:test');
const assert = require('node:assert/strict');
const { Op } = require('sequelize');
const {
    create_recommendation_job_service,
    ENQUEUE_SQL,
    INITIAL_ENQUEUE_SQL
} = require('../services/recommendationJobService');

function create_job_model(records) {
    function instance_for(record) {
        return {
            ...record,
            async save() {
                records.set(Number(this.user_id), { ...this });
            }
        };
    }

    return {
        async findAll(options) {
            assert.equal(options.skipLocked, true);
            assert.equal(options.lock, 'UPDATE');
            const [pending, processing] = options.where[Op.or];
            const due = [...records.values()].filter((record) => {
                const pendingDue = record.status === pending.status &&
                    record.available_at <= pending.available_at[Op.lte];
                const leaseExpired = record.status === processing.status &&
                    record.locked_until <= processing.locked_until[Op.lte];
                return pendingDue || leaseExpired;
            });
            return due.slice(0, options.limit).map(instance_for);
        },
        async findByPk(userId) {
            const record = records.get(Number(userId));
            return record ? instance_for(record) : null;
        },
        async update(values, options) {
            const record = records.get(Number(options.where.user_id));
            if (
                !record ||
                record.status !== options.where.status ||
                record.lock_token !== options.where.lock_token
            ) {
                return [0];
            }
            records.set(Number(record.user_id), { ...record, ...values });
            return [1];
        }
    };
}

function create_harness({ now = new Date('2026-03-01T00:00:00.000Z'), records = new Map(), ...options } = {}) {
    const sequelize = {
        async transaction(callback) {
            return callback({ LOCK: { UPDATE: 'UPDATE' } });
        },
        async query(sql, queryOptions) {
            this.queries.push({ sql, ...queryOptions });
        },
        queries: []
    };
    const UserRecommendationJob = create_job_model(records);
    const service = create_recommendation_job_service({
        sequelize,
        UserRecommendationJob,
        now: () => new Date(now),
        debounceMs: 4000,
        retryBaseMs: 5000,
        retryMaxMs: 60000,
        maxAttempts: 2,
        createLockToken: (() => {
            let token = 0;
            return () => `lock-${++token}`;
        })(),
        ...options
    });
    return { records, service, sequelize, set_now: (value) => { now = new Date(value); } };
}

test('interaction enqueue is transactional and coalesces updates on one user row', async () => {
    const { service, sequelize } = create_harness();
    const transaction = { id: 'interaction-transaction' };

    await service.enqueue_for_user(12, transaction);
    await service.enqueue_for_user(12, transaction);

    assert.equal(sequelize.queries.length, 2);
    assert.match(ENQUEUE_SQL, /ON DUPLICATE KEY UPDATE/);
    assert.match(ENQUEUE_SQL, /request_version.*request_version.*\+ 1/s);
    assert.ok(sequelize.queries.every((query) => query.transaction === transaction));
    assert.ok(sequelize.queries.every((query) => query.replacements.debounceMicroseconds === 4000000));
});

test('first-view enqueue inserts only when a user has no job row', async () => {
    const { service, sequelize } = create_harness();
    await service.enqueue_initial(7);

    assert.equal(sequelize.queries.length, 1);
    assert.match(INITIAL_ENQUEUE_SQL, /INSERT IGNORE/);
    assert.equal(sequelize.queries[0].replacements.userId, 7);
});

test('claiming recovers expired leases and fences a job while its lease is valid', async () => {
    const now = new Date('2026-03-01T00:00:00.000Z');
    const records = new Map([
        [1, {
            user_id: 1,
            status: 'pending',
            request_version: '1',
            attempts: 0,
            available_at: new Date(now.getTime() - 1000),
            locked_until: null,
            lock_token: null
        }],
        [2, {
            user_id: 2,
            status: 'processing',
            request_version: '4',
            attempts: 1,
            available_at: new Date(now.getTime() - 3000),
            locked_until: new Date(now.getTime() - 1000),
            lock_token: 'abandoned-lock'
        }]
    ]);
    const { service } = create_harness({ now, records });

    const claimed = await service.claim_jobs({ limit: 5, leaseMs: 30000 });
    const secondClaim = await service.claim_jobs({ limit: 5, leaseMs: 30000 });

    assert.deepEqual(claimed.map((job) => job.user_id), [1, 2]);
    assert.equal(claimed[1].attempts, 2);
    assert.deepEqual(secondClaim, []);
});

test('marks an abandoned final attempt failed instead of claiming it forever', async () => {
    const now = new Date('2026-03-01T00:00:00.000Z');
    const records = new Map([[8, {
        user_id: 8,
        status: 'processing',
        request_version: '1',
        attempts: 2,
        available_at: new Date(now.getTime() - 3000),
        locked_until: new Date(now.getTime() - 1000),
        lock_token: 'expired-final-lock'
    }]]);
    const { service } = create_harness({ now, records, maxAttempts: 2 });

    const claimed = await service.claim_jobs({ limit: 1, leaseMs: 30000 });

    assert.deepEqual(claimed, []);
    assert.equal(records.get(8).status, 'failed');
    assert.equal(records.get(8).lock_token, null);
    assert.match(records.get(8).last_error, /maximum number of attempts/);
});

test('completion keeps a newer interaction pending instead of completing stale work', async () => {
    const now = new Date('2026-03-01T00:00:00.000Z');
    const records = new Map([[3, {
        user_id: 3,
        status: 'processing',
        request_version: '2',
        attempts: 1,
        available_at: new Date(now.getTime() + 4000),
        locked_until: new Date(now.getTime() + 30000),
        lock_token: 'worker-lock'
    }]]);
    const { service } = create_harness({ now, records });

    const result = await service.complete_job({
        user_id: 3,
        request_version: '1',
        lock_token: 'worker-lock'
    });

    assert.deepEqual(result, { owned: true, status: 'pending', superseded: true });
    assert.equal(records.get(3).attempts, 0);
    assert.equal(records.get(3).lock_token, null);
});

test('defers a claimed job when its advisory generation lock is busy', async () => {
    const now = new Date('2026-03-01T00:00:00.000Z');
    const records = new Map([[9, {
        user_id: 9,
        status: 'processing',
        request_version: '1',
        attempts: 1,
        available_at: new Date(now.getTime()),
        locked_until: new Date(now.getTime() + 30000),
        lock_token: 'busy-lock'
    }]]);
    const { service } = create_harness({ now, records });

    const deferred = await service.defer_job({
        user_id: 9,
        request_version: '1',
        lock_token: 'busy-lock'
    }, 1000);

    assert.equal(deferred, true);
    assert.equal(records.get(9).status, 'pending');
    assert.equal(records.get(9).attempts, 0);
    assert.equal(records.get(9).available_at.getTime(), now.getTime() + 1000);
});

test('failed work is retried with backoff and eventually becomes terminal', async () => {
    const now = new Date('2026-03-01T00:00:00.000Z');
    const record = {
        user_id: 4,
        status: 'processing',
        request_version: '1',
        attempts: 1,
        available_at: new Date(now.getTime()),
        locked_until: new Date(now.getTime() + 30000),
        lock_token: 'retry-lock'
    };
    const records = new Map([[4, record]]);
    const { service } = create_harness({ now, records });
    const job = {
        user_id: 4,
        request_version: '1',
        attempts: 1,
        lock_token: 'retry-lock'
    };

    const retry = await service.fail_job(job, new Error('Temporary candidate error'));
    assert.equal(retry.status, 'pending');
    assert.equal(records.get(4).last_error, 'Error: Temporary candidate error');
    assert.equal(records.get(4).available_at.getTime(), now.getTime() + 5000);

    Object.assign(records.get(4), {
        status: 'processing',
        attempts: 2,
        lock_token: 'final-lock'
    });
    const failed = await service.fail_job({ ...job, attempts: 2, lock_token: 'final-lock' }, new Error('Still failing'));
    assert.equal(failed.status, 'failed');
    assert.equal(records.get(4).status, 'failed');
});
