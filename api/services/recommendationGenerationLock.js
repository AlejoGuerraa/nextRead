const { createHash } = require('node:crypto');
const { promisify } = require('node:util');

function create_recommendation_generation_lock({ sequelize, databaseName = sequelize.config.database }) {
    async function with_user_lock(userId, callback) {
        const numericUserId = Number(userId);
        if (!Number.isSafeInteger(numericUserId) || numericUserId <= 0) {
            throw new TypeError('A positive safe user ID is required for a generation lock');
        }
        const lockName = createHash('sha256')
            .update(`recommendation:${databaseName}:${numericUserId}`)
            .digest('hex');
        const connection = await sequelize.connectionManager.getConnection({
            type: 'WRITE',
            useMaster: true
        });
        const query = promisify(connection.query).bind(connection);
        let acquired = false;
        let destroyConnection = false;

        try {
            let rows;
            try {
                rows = await query('SELECT GET_LOCK(?, 0) AS acquired', [lockName]);
            } catch (error) {
                destroyConnection = true;
                throw error;
            }
            acquired = Number(rows[0]?.acquired) === 1;
            if (!acquired) return { acquired: false };

            return {
                acquired: true,
                value: await callback()
            };
        } finally {
            let releaseError = null;
            if (acquired) {
                try {
                    const rows = await query('SELECT RELEASE_LOCK(?) AS released', [lockName]);
                    if (Number(rows[0]?.released) !== 1) {
                        throw new Error('Failed to release the recommendation generation lock');
                    }
                } catch (error) {
                    destroyConnection = true;
                    releaseError = error;
                }
            }

            if (destroyConnection) {
                await sequelize.connectionManager.destroyConnection(connection);
            } else {
                sequelize.connectionManager.releaseConnection(connection);
            }
            if (releaseError) throw releaseError;
        }
    }

    return { with_user_lock };
}

module.exports = { create_recommendation_generation_lock };
