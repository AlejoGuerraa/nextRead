const { createHash } = require('node:crypto');
const { QueryTypes } = require('sequelize');
const {
    effective_weight,
    normalize_tag,
    normalize_tags,
    parse_preferences
} = require('./tagPreferenceService');

const DEFAULT_CANDIDATE_COUNT = 150;
const MAX_CANDIDATE_COUNT = 200;
const MAX_CANDIDATE_TAGS = 8;
const DEFAULT_EXPLORATION_RATIO = 0.2;
const DEFAULT_CANDIDATE_GROUP_MULTIPLIER = 1.5;

function compare_strings(left, right) {
    return left < right ? -1 : left > right ? 1 : 0;
}

const CANDIDATE_SELECT = `
    SELECT
        book.id,
        book.titulo,
        book.anio,
        book.tipo,
        book.generos,
        book.tags,
        book.id_autor
    FROM \`Libro\` AS book
    WHERE book.tags IS NOT NULL
        AND JSON_TYPE(book.tags) = 'ARRAY'
        AND JSON_LENGTH(book.tags) > 0
        AND book.titulo IS NOT NULL
        AND TRIM(book.titulo) <> ''
        AND NOT EXISTS (
            SELECT 1
            FROM \`user_book_states\` AS state
            WHERE state.user_id = :userId
                AND state.book_id = book.id
                AND state.reading_status = 'read'
        )
`;

function parse_book_tags(value) {
    if (typeof value === 'string') {
        try {
            value = JSON.parse(value);
        } catch {
            return [];
        }
    }
    return normalize_tags(value);
}

function parse_metadata_array(value) {
    if (typeof value === 'string') {
        try {
            value = JSON.parse(value);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(value)) return [];
    return [...new Set(value
        .filter((entry) => typeof entry === 'string')
        .map((entry) => entry.trim().normalize('NFC').toLowerCase())
        .filter(Boolean))];
}

function is_valid_catalog_book(book) {
    const id = Number(book && book.id);
    return Boolean(
        book &&
        Number.isSafeInteger(id) &&
        id > 0 &&
        typeof book.titulo === 'string' &&
        book.titulo.trim() &&
        parse_book_tags(book.tags).length > 0
    );
}

function score_book(book, effectiveWeights) {
    const tags = parse_book_tags(book.tags);
    const matchedTags = tags.filter((tag) => effectiveWeights.has(tag));
    const sharedWeight = matchedTags.reduce((sum, tag) => sum + effectiveWeights.get(tag), 0);
    const sharedMagnitude = matchedTags.reduce((sum, tag) => sum + Math.abs(effectiveWeights.get(tag)), 0);
    const normalizedCompatibility = sharedMagnitude === 0
        ? 0
        : sharedWeight / Math.max(1, sharedMagnitude);
    const score = Math.max(-1, Math.min(1, normalizedCompatibility));

    return {
        score,
        matchedTags
    };
}

function get_recommendation_profile(preferences) {
    const parsedPreferences = parse_preferences(preferences);
    const recommendation = parsedPreferences.recommendation || {};
    const preferenceTags = recommendation.tags || {};
    if (typeof preferenceTags !== 'object' || Array.isArray(preferenceTags)) {
        throw new Error('Tag preferences must be a JSON object');
    }
    return { parsedPreferences, recommendation, preferenceTags };
}

function get_generation_sequence(preferences) {
    const { recommendation } = get_recommendation_profile(preferences);
    const sequence = recommendation.generation_sequence == null
        ? 0
        : Number(recommendation.generation_sequence);
    if (!Number.isSafeInteger(sequence) || sequence < 0) {
        throw new Error('Recommendation generation sequence is invalid');
    }
    return sequence;
}

function fingerprint_tag_preferences(preferences) {
    const { preferenceTags } = get_recommendation_profile(preferences);
    const entries = Object.entries(preferenceTags)
        .map(([rawTag, entry]) => {
            const tag = normalize_tag(rawTag);
            if (!tag) return null;
            const validEntry = entry && typeof entry === 'object' && !Array.isArray(entry);
            return [
                tag,
                validEntry ? entry.weight : null,
                validEntry ? entry.updated_at : null
            ];
        })
        .filter(Boolean)
        .sort((left, right) => compare_strings(left[0], right[0]) ||
            compare_strings(JSON.stringify(left), JSON.stringify(right)));
    return createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}

function get_effective_weights(preferences, now = new Date()) {
    const { preferenceTags } = get_recommendation_profile(preferences);

    const weights = new Map();
    for (const [rawTag, entry] of Object.entries(preferenceTags)) {
        const tag = normalize_tag(rawTag);
        if (!tag) continue;
        const weight = effective_weight(entry, now);
        if (Math.abs(weight) < 1e-12) continue;
        const previous = weights.get(tag);
        if (previous == null || Math.abs(weight) > Math.abs(previous)) {
            weights.set(tag, weight);
        }
    }
    return weights;
}

function seeded_order(userId, generationId, value) {
    return createHash('sha256')
        .update(`${userId}:${generationId}:${value}`)
        .digest('hex');
}

function merge_candidate_sources(tagGroups, explorationBooks) {
    const candidates = new Map();
    const add = (book, source) => {
        if (!is_valid_catalog_book(book)) return;
        const id = Number(book.id);
        let candidate = candidates.get(id);
        if (!candidate) {
            candidate = { ...book, id, sources: new Set() };
            candidates.set(id, candidate);
        }
        candidate.sources.add(source);
    };

    for (const group of tagGroups) {
        for (const book of group) add(book, 'interest');
    }
    for (const book of explorationBooks) add(book, 'exploration');
    return [...candidates.values()];
}

function get_candidate_dimensions(candidate, effectiveWeights) {
    const tags = parse_book_tags(candidate.tags);
    const positiveTags = tags
        .filter((tag) => effectiveWeights.has(tag) && effectiveWeights.get(tag) > 0)
        .sort((left, right) =>
            effectiveWeights.get(right) - effectiveWeights.get(left) ||
            (left < right ? -1 : left > right ? 1 : 0)
        );
    const genres = parse_metadata_array(candidate.generos);
    const year = Number(candidate.anio);
    return {
        author: candidate.id_autor == null ? null : String(candidate.id_autor),
        genres,
        decade: Number.isInteger(year) && year > 0 ? Math.floor(year / 10) * 10 : null,
        type: typeof candidate.tipo === 'string' ? candidate.tipo.trim().toLowerCase() : null,
        primaryInterest: positiveTags[0] || null
    };
}

function diversity_penalty(candidate, counts, effectiveWeights) {
    const dimensions = get_candidate_dimensions(candidate, effectiveWeights);
    let penalty = 0;

    if (dimensions.author) {
        const authorCount = counts.authors.get(dimensions.author) || 0;
        penalty += authorCount * 0.07;
        if (authorCount >= 3) penalty += (authorCount - 2) * 0.18;
    }
    for (const genre of dimensions.genres) {
        penalty += (counts.genres.get(genre) || 0) * 0.025;
    }
    if (dimensions.decade != null) {
        penalty += (counts.decades.get(dimensions.decade) || 0) * 0.02;
    }
    if (dimensions.type) {
        penalty += (counts.types.get(dimensions.type) || 0) * 0.02;
    }
    if (dimensions.primaryInterest) {
        penalty += (counts.interests.get(dimensions.primaryInterest) || 0) * 0.04;
    }
    return penalty;
}

function increment_count(map, key) {
    if (key == null) return;
    map.set(key, (map.get(key) || 0) + 1);
}

function update_diversity_counts(candidate, counts, effectiveWeights) {
    const dimensions = get_candidate_dimensions(candidate, effectiveWeights);
    increment_count(counts.authors, dimensions.author);
    dimensions.genres.forEach((genre) => increment_count(counts.genres, genre));
    increment_count(counts.decades, dimensions.decade);
    increment_count(counts.types, dimensions.type);
    increment_count(counts.interests, dimensions.primaryInterest);
}

function select_diverse(
    candidates,
    count,
    userId,
    generationId,
    effectiveWeights,
    mode = 'compatibility'
) {
    const remaining = [...candidates];
    const selected = [];
    const tieBreakers = new Map(remaining.map((candidate) => [
        candidate.id,
        seeded_order(userId, generationId, candidate.id)
    ]));
    const counts = {
        authors: new Map(),
        genres: new Map(),
        decades: new Map(),
        types: new Map(),
        interests: new Map()
    };

    while (remaining.length > 0 && selected.length < count) {
        let bestIndex = 0;
        let bestScore = Number.NEGATIVE_INFINITY;
        for (let index = 0; index < remaining.length; index += 1) {
            const candidate = remaining[index];
            const baseScore = mode === 'exploration' && candidate.score >= 0
                ? 0
                : mode === 'exploration'
                    ? candidate.score * 10
                    : candidate.score;
            const candidateScore = baseScore - diversity_penalty(
                candidate,
                counts,
                effectiveWeights
            );
            const best = remaining[bestIndex];
            if (
                candidateScore > bestScore ||
                (candidateScore === bestScore &&
                    tieBreakers.get(candidate.id) < tieBreakers.get(best.id))
            ) {
                bestIndex = index;
                bestScore = candidateScore;
            }
        }

        const [next] = remaining.splice(bestIndex, 1);
        selected.push(next);
        update_diversity_counts(next, counts, effectiveWeights);
    }
    return selected;
}

function interleave_candidates(compatibility, exploration, count, explorationRatio) {
    const result = [];
    const interval = Math.max(1, Math.round(1 / explorationRatio));
    let compatibilityIndex = 0;
    let explorationIndex = 0;

    for (let position = 1; position <= count; position += 1) {
        const shouldExplore = explorationIndex < exploration.length &&
            (position % interval === 0 || compatibilityIndex >= compatibility.length);
        const candidate = shouldExplore
            ? exploration[explorationIndex++]
            : compatibility[compatibilityIndex++];
        if (candidate) result.push(candidate);
    }
    while (compatibilityIndex < compatibility.length && result.length < count) {
        result.push(compatibility[compatibilityIndex++]);
    }
    while (explorationIndex < exploration.length && result.length < count) {
        result.push(exploration[explorationIndex++]);
    }
    return result;
}

async function generate_candidate_set({
    userId,
    generationId = 0,
    preferences,
    get_max_book_id = async () => MAX_CANDIDATE_COUNT,
    fetch_candidates_by_tag,
    fetch_exploration_candidates,
    targetSize = DEFAULT_CANDIDATE_COUNT,
    maxInterestTags = MAX_CANDIDATE_TAGS,
    candidateGroupMultiplier = DEFAULT_CANDIDATE_GROUP_MULTIPLIER,
    explorationRatio = DEFAULT_EXPLORATION_RATIO,
    now = new Date()
}) {
    if (!Number.isSafeInteger(Number(userId)) || Number(userId) <= 0) {
        throw new Error('A valid user id is required to generate recommendations');
    }
    if (!Number.isSafeInteger(Number(generationId)) || Number(generationId) < 0) {
        throw new Error('A valid generation id is required to generate recommendations');
    }
    if (!Number.isInteger(targetSize) || targetSize < 1 || targetSize > MAX_CANDIDATE_COUNT) {
        throw new Error(`Candidate count must be between 1 and ${MAX_CANDIDATE_COUNT}`);
    }
    if (!Number.isInteger(maxInterestTags) || maxInterestTags < 1 || maxInterestTags > 32) {
        throw new Error('Interest tag query limit must be between 1 and 32');
    }
    if (!Number.isFinite(candidateGroupMultiplier) || candidateGroupMultiplier < 1) {
        throw new Error('Candidate group multiplier must be at least 1');
    }
    if (!Number.isFinite(explorationRatio) || explorationRatio < 0 || explorationRatio > 1) {
        throw new Error('Exploration ratio must be between 0 and 1');
    }

    const effectiveWeights = get_effective_weights(preferences, now);
    const maxBookId = Number(await get_max_book_id({ userId: Number(userId) }));
    if (!Number.isSafeInteger(maxBookId) || maxBookId < 0) {
        throw new Error('Catalog book id bound is invalid');
    }
    if (maxBookId === 0) return [];

    const positiveTags = [...effectiveWeights.entries()]
        .filter(([, weight]) => weight > 0)
        .sort((left, right) =>
            right[1] - left[1] ||
            compare_strings(
                seeded_order(userId, generationId, left[0]),
                seeded_order(userId, generationId, right[0])
            )
        )
        .slice(0, maxInterestTags);
    const perTagLimit = Math.min(
        MAX_CANDIDATE_COUNT,
        Math.ceil(targetSize * candidateGroupMultiplier / Math.max(1, positiveTags.length))
    );
    const requestedExploration = Math.min(
        MAX_CANDIDATE_COUNT,
        Math.max(
            20,
            positiveTags.length === 0
                ? targetSize
                : Math.ceil(targetSize * explorationRatio * 4)
        )
    );

    const tagGroups = await Promise.all(positiveTags.map(([tag]) =>
        fetch_candidates_by_tag({
            userId: Number(userId),
            generationId: Number(generationId),
            maxBookId,
            tag,
            limit: perTagLimit
        })
    ));
    const interestIds = new Set(tagGroups.flat()
        .filter((book) => is_valid_catalog_book(book))
        .map((book) => Number(book.id)));
    const explorationBooks = await fetch_exploration_candidates({
        userId: Number(userId),
        generationId: Number(generationId),
        maxBookId,
        excludedBookIds: [...interestIds],
        limit: requestedExploration
    });

    const candidates = merge_candidate_sources(tagGroups, explorationBooks).map((book) => ({
        ...book,
        ...score_book(book, effectiveWeights),
        explorationEligible: book.sources.has('exploration') && !book.sources.has('interest')
    }));
    if (candidates.length === 0) return [];

    const explorationPool = candidates.filter((candidate) => candidate.explorationEligible);
    const compatibilityPool = candidates.filter((candidate) => !candidate.explorationEligible);
    const explorationCount = explorationRatio === 0
        ? 0
        : Math.min(
            explorationPool.length,
            compatibilityPool.length === 0
                ? targetSize
                : Math.ceil(targetSize * explorationRatio)
        );
    const exploration = select_diverse(
        explorationPool,
        explorationCount,
        Number(userId),
        Number(generationId),
        effectiveWeights,
        'exploration'
    );
    const explorationIds = new Set(exploration.map((candidate) => candidate.id));
    const compatibility = select_diverse(
        compatibilityPool.filter((candidate) => !explorationIds.has(candidate.id)),
        targetSize - exploration.length,
        Number(userId),
        Number(generationId),
        effectiveWeights
    );
    const selected = interleave_candidates(
        compatibility,
        exploration,
        Math.min(targetSize, candidates.length),
        explorationRatio
    );
    const selectedExplorationIds = new Set(exploration.map((candidate) => candidate.id));

    return selected.map((candidate, index) => ({
        book_id: candidate.id,
        score: candidate.score,
        position: index + 1,
        is_exploration: selectedExplorationIds.has(candidate.id)
    }));
}

function create_candidate_repository({ sequelize }) {
    async function get_max_book_id({ transaction } = {}) {
        const [row] = await sequelize.query(
            'SELECT COALESCE(MAX(id), 0) AS max_id FROM `Libro`',
            { type: QueryTypes.SELECT, transaction }
        );
        return Number(row ? row.max_id : 0);
    }

    function get_cursor(userId, generationId, partition, maxBookId) {
        const hash = seeded_order(userId, generationId, partition);
        const value = Number.parseInt(hash.slice(0, 8), 16);
        return (value % maxBookId) + 1;
    }

    async function query_range({
        userId,
        limit,
        tag,
        excludedBookIds = [],
        comparison,
        cursor
    }) {
        if (limit <= 0) return [];

        const tagFilter = tag == null ? '' : `
        AND JSON_CONTAINS(book.tags, :candidateTags) = 1
`;
        const exclusionFilter = excludedBookIds.length === 0 ? '' : `
        AND book.id NOT IN (:excludedBookIds)
`;
        const sql = `${CANDIDATE_SELECT}
        AND book.id ${comparison} :cursor
        ${tagFilter}${exclusionFilter}
        ORDER BY book.id ${comparison === '>=' ? 'ASC' : 'DESC'}
        LIMIT :limit
`;
        return sequelize.query(sql, {
            replacements: {
                userId,
                cursor,
                limit,
                ...(tag == null ? {} : { candidateTags: JSON.stringify([tag]) }),
                ...(excludedBookIds.length === 0 ? {} : { excludedBookIds })
            },
            type: QueryTypes.SELECT
        });
    }

    async function query_candidates({
        userId,
        generationId,
        maxBookId,
        limit,
        tag,
        excludedBookIds
    }) {
        if (maxBookId === 0 || limit <= 0) return [];
        const cursor = get_cursor(
            userId,
            generationId,
            tag == null ? 'exploration' : `tag:${tag}`,
            maxBookId
        );
        const firstRange = await query_range({
            userId,
            limit,
            tag,
            excludedBookIds,
            comparison: '>=',
            cursor
        });
        if (firstRange.length >= limit) return firstRange;

        const wrappedRange = await query_range({
            userId,
            limit: limit - firstRange.length,
            tag,
            excludedBookIds,
            comparison: '<',
            cursor
        });
        return [...firstRange, ...wrappedRange];
    }

    return {
        get_max_book_id,
        fetch_candidates_by_tag: (options) => query_candidates(options),
        fetch_exploration_candidates: (options) => query_candidates(options)
    };
}

function create_recommendation_service({
    sequelize,
    Usuario,
    UserRecommendation,
    candidateRepository = create_candidate_repository({ sequelize }),
    targetSize = DEFAULT_CANDIDATE_COUNT,
    maxInterestTags = MAX_CANDIDATE_TAGS,
    candidateGroupMultiplier = DEFAULT_CANDIDATE_GROUP_MULTIPLIER,
    explorationRatio = DEFAULT_EXPLORATION_RATIO
}) {
    async function reserve_generation(userId) {
        return sequelize.transaction(async (transaction) => {
            const user = await Usuario.findByPk(userId, {
                attributes: ['id', 'preferences'],
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!user) {
                const error = new Error(`User ${userId} does not exist`);
                error.code = 'RECOMMENDATION_USER_NOT_FOUND';
                throw error;
            }

            const preferences = parse_preferences(user.preferences);
            const recommendation = preferences.recommendation || {};
            const generationId = get_generation_sequence(preferences) + 1;
            if (!Number.isSafeInteger(generationId)) {
                throw new Error('Recommendation generation sequence is exhausted');
            }
            const snapshot = {
                ...preferences,
                recommendation: {
                    ...recommendation,
                    generation_sequence: generationId
                }
            };
            user.preferences = snapshot;
            await user.save({ transaction, fields: ['preferences'] });

            return {
                generationId,
                preferences: snapshot,
                tagFingerprint: fingerprint_tag_preferences(snapshot)
            };
        });
    }

    async function generate_for_user(userId, { now = new Date() } = {}) {
        const generation = await reserve_generation(userId);
        const recommendations = await generate_candidate_set({
            userId: Number(userId),
            generationId: generation.generationId,
            preferences: generation.preferences,
            ...candidateRepository,
            targetSize,
            maxInterestTags,
            candidateGroupMultiplier,
            explorationRatio,
            now
        });

        const published = await sequelize.transaction(async (transaction) => {
            const lockedUser = await Usuario.findByPk(userId, {
                attributes: ['id', 'preferences'],
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!lockedUser) {
                const error = new Error(`User ${userId} does not exist`);
                error.code = 'RECOMMENDATION_USER_NOT_FOUND';
                throw error;
            }

            if (
                get_generation_sequence(lockedUser.preferences) !== generation.generationId ||
                fingerprint_tag_preferences(lockedUser.preferences) !== generation.tagFingerprint
            ) {
                return false;
            }

            await UserRecommendation.destroy({
                where: { user_id: userId },
                transaction
            });
            if (recommendations.length > 0) {
                await UserRecommendation.bulkCreate(recommendations.map((recommendation) => ({
                    user_id: userId,
                    book_id: recommendation.book_id,
                    generation_id: generation.generationId,
                    score: recommendation.score,
                    position: recommendation.position,
                    is_exploration: recommendation.is_exploration
                })), { transaction });
            }
            return true;
        });

        if (!published) {
            const error = new Error(`Recommendation generation ${generation.generationId} was superseded`);
            error.code = 'RECOMMENDATION_GENERATION_STALE';
            throw error;
        }

        return {
            generation_id: generation.generationId,
            recommendations
        };
    }

    return { generate_for_user };
}

module.exports = {
    DEFAULT_CANDIDATE_COUNT,
    DEFAULT_CANDIDATE_GROUP_MULTIPLIER,
    DEFAULT_EXPLORATION_RATIO,
    MAX_CANDIDATE_COUNT,
    create_candidate_repository,
    create_recommendation_service,
    generate_candidate_set,
    get_effective_weights,
    is_valid_catalog_book,
    merge_candidate_sources,
    parse_book_tags,
    score_book
};
