const test = require('node:test');
const assert = require('node:assert/strict');
const { create_recommendation_generation_lock } = require('../services/recommendationGenerationLock');

function create_connection(acquired = 1, released = 1) {
    const queries = [];
    const connection = {
        query(sql, values, callback) {
            queries.push({ sql, values });
            callback(null, [{
                [sql.includes('GET_LOCK') ? 'acquired' : 'released']:
                    sql.includes('GET_LOCK') ? acquired : released
            }]);
        }
    };
    const manager = {
        released: 0,
        destroyed: 0,
        async getConnection() { return connection; },
        releaseConnection() { this.released += 1; },
        async destroyConnection() { this.destroyed += 1; }
    };
    return { connection, manager, queries };
}

test('holds and releases the per-user MySQL advisory lock around generation', async () => {
    const { manager, queries } = create_connection();
    const lock = create_recommendation_generation_lock({
        sequelize: { config: { database: 'nextread' }, connectionManager: manager }
    });
    let generated = false;

    const result = await lock.with_user_lock(15, async () => {
        generated = true;
        return 'published';
    });

    assert.deepEqual(result, { acquired: true, value: 'published' });
    assert.equal(generated, true);
    assert.match(queries[0].sql, /GET_LOCK/);
    assert.match(queries[1].sql, /RELEASE_LOCK/);
    assert.equal(manager.released, 1);
    assert.equal(manager.destroyed, 0);
});

test('does not execute generation when the MySQL advisory lock is already held', async () => {
    const { manager, queries } = create_connection(0);
    const lock = create_recommendation_generation_lock({
        sequelize: { config: { database: 'nextread' }, connectionManager: manager }
    });
    let generated = false;

    const result = await lock.with_user_lock(15, async () => {
        generated = true;
    });

    assert.deepEqual(result, { acquired: false });
    assert.equal(generated, false);
    assert.equal(queries.length, 1);
    assert.equal(manager.released, 1);
});

test('destroys a pooled connection if the advisory lock cannot be released', async () => {
    const { manager } = create_connection(1, 0);
    const lock = create_recommendation_generation_lock({
        sequelize: { config: { database: 'nextread' }, connectionManager: manager }
    });

    await assert.rejects(lock.with_user_lock(15, async () => true), /Failed to release/);
    assert.equal(manager.destroyed, 1);
    assert.equal(manager.released, 0);
});
