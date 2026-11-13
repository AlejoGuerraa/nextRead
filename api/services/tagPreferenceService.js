const RATING_IMPACTS = Object.freeze({
    1: -0.30,
    2: -0.20,
    3: 0.15,
    4: 0.25,
    5: 0.40
});

const WEIGHT_LIMIT = 1 - 1e-12;
const CONTRIBUTION_EPSILON = 1e-12;
const DECAY_RETENTION = 0.8;
const DECAY_PERIOD_DAYS = 150;

function normalize_tag(tag) {
    if (typeof tag !== 'string') return null;
    const normalized = tag.trim().normalize('NFC').toLowerCase();
    return normalized || null;
}

function normalize_tags(value) {
    let tags = value;
    if (typeof tags === 'string') tags = JSON.parse(tags);
    if (!Array.isArray(tags)) return [];
    return [...new Set(tags.map(normalize_tag).filter(Boolean))];
}

function build_book_contributions(tags, sources) {
    const normalizedTags = normalize_tags(tags);
    if (normalizedTags.length === 0) return {};

    const impacts = [];
    if (sources.isFavorite) impacts.push(0.30);
    if (sources.readingStatus === 'reading') impacts.push(0.05);
    if (sources.readingStatus === 'to_read') impacts.push(0.15);

    const rating = Number.isInteger(sources.rating) ? sources.rating : null;
    if (rating !== null && RATING_IMPACTS[rating] !== undefined) {
        impacts.push(RATING_IMPACTS[rating]);
    } else if (sources.readingStatus === 'read') {
        impacts.push(0.10);
    }

    const rawContribution = impacts.reduce((sum, impact) => sum + Math.atanh(impact), 0);
    if (Math.abs(rawContribution) < CONTRIBUTION_EPSILON) return {};
    return Object.fromEntries(normalizedTags.map((tag) => [tag, rawContribution]));
}

function parse_preferences(value) {
    let preferences = value;
    if (typeof preferences === 'string') preferences = JSON.parse(preferences);
    if (preferences == null) return {};
    if (typeof preferences !== 'object' || Array.isArray(preferences)) {
        throw new Error('User preferences must be a JSON object');
    }
    if (
        preferences.recommendation != null &&
        (typeof preferences.recommendation !== 'object' || Array.isArray(preferences.recommendation))
    ) {
        throw new Error('Recommendation preferences must be a JSON object');
    }
    return JSON.parse(JSON.stringify(preferences));
}

function parse_contributions(value) {
    let contributions = value;
    if (typeof contributions === 'string') contributions = JSON.parse(contributions);
    if (contributions == null) return {};
    if (typeof contributions !== 'object' || Array.isArray(contributions)) {
        throw new Error('Book preference contributions must be a JSON object');
    }

    const normalized = {};
    for (const [tag, contribution] of Object.entries(contributions)) {
        const key = normalize_tag(tag);
        const numericContribution = Number(contribution);
        if (!key || !Number.isFinite(numericContribution)) {
            throw new Error('Book preference contribution is invalid');
        }
        if (Math.abs(numericContribution) >= CONTRIBUTION_EPSILON) {
            normalized[key] = numericContribution;
        }
    }
    return normalized;
}

function same_contributions(left, right) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return leftKeys.length === rightKeys.length && leftKeys.every((tag) =>
        Object.prototype.hasOwnProperty.call(right, tag) &&
        Math.abs(left[tag] - right[tag]) < CONTRIBUTION_EPSILON
    );
}

function decay_factor(updatedAt, now = new Date()) {
    const updatedAtMs = Date.parse(updatedAt);
    const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
    if (!Number.isFinite(updatedAtMs) || !Number.isFinite(nowMs)) {
        throw new Error('Tag preference timestamp is invalid');
    }
    const elapsedDays = Math.max(0, (nowMs - updatedAtMs) / 86400000);
    return DECAY_RETENTION ** (elapsedDays / DECAY_PERIOD_DAYS);
}

function effective_weight(entry, now = new Date()) {
    if (!entry) return 0;
    const weight = Number(entry.weight);
    if (!Number.isFinite(weight) || Math.abs(weight) > WEIGHT_LIMIT) {
        throw new Error('Tag preference weight is outside its supported range');
    }
    return weight * decay_factor(entry.updated_at, now);
}

function bounded_weight(value) {
    return Math.max(-WEIGHT_LIMIT, Math.min(WEIGHT_LIMIT, Math.tanh(value)));
}

function apply_contribution_delta(preferencesValue, oldContributionsValue, newContributionsValue, now = new Date()) {
    const preferences = parse_preferences(preferencesValue);
    const oldContributions = parse_contributions(oldContributionsValue);
    const newContributions = parse_contributions(newContributionsValue);
    const recommendation = preferences.recommendation || {};
    if (typeof recommendation !== 'object' || Array.isArray(recommendation)) {
        throw new Error('Recommendation preferences must be a JSON object');
    }
    const tags = { ...(recommendation.tags || {}) };
    if (recommendation.tags != null && (typeof recommendation.tags !== 'object' || Array.isArray(recommendation.tags))) {
        throw new Error('Tag preferences must be a JSON object');
    }

    const affectedTags = new Set([
        ...Object.keys(oldContributions),
        ...Object.keys(newContributions)
    ]);
    let changed = false;
    const updatedAt = (now instanceof Date ? now : new Date(now)).toISOString();

    for (const tag of affectedTags) {
        const oldValue = oldContributions[tag] || 0;
        const newValue = newContributions[tag] || 0;
        if (Math.abs(newValue - oldValue) < CONTRIBUTION_EPSILON) continue;

        const entry = tags[tag];
        if (!entry && Math.abs(oldValue) >= CONTRIBUTION_EPSILON) {
            const error = new Error(`Missing aggregate preference for tag ${tag}`);
            error.code = 'TAG_PREFERENCE_AGGREGATE_MISSING';
            throw error;
        }

        const current = entry || {
            weight: 0,
            evidence_sum: 0,
            evidence_scale: 1,
            contribution_count: 0,
            updated_at: updatedAt
        };
        const weight = Number(current.weight);
        const evidenceSum = Number(current.evidence_sum);
        const evidenceScale = Number(current.evidence_scale);
        const evidenceOffset = Number(current.evidence_offset || 0);
        const contributionCount = Number(current.contribution_count);
        if (
            !Number.isFinite(weight) ||
            Math.abs(weight) > WEIGHT_LIMIT ||
            !Number.isFinite(evidenceSum) ||
            !Number.isFinite(evidenceScale) ||
            !Number.isFinite(evidenceOffset) ||
            !Number.isSafeInteger(contributionCount) ||
            contributionCount < 0
        ) {
            throw new Error(`Tag preference entry is invalid for ${tag}`);
        }

        const decayedWeight = effective_weight(current, now);
        const effectiveEvidence = Math.atanh(Math.max(-WEIGHT_LIMIT, Math.min(WEIGHT_LIMIT, decayedWeight)));
        let effectiveScale = evidenceScale;
        if (Math.abs(evidenceSum) >= CONTRIBUTION_EPSILON) {
            effectiveScale = effectiveEvidence / evidenceSum;
        }
        const effectiveOffset = effectiveEvidence - effectiveScale * evidenceSum;

        const nextSum = evidenceSum - oldValue + newValue;
        const nextEvidence = effectiveScale * (evidenceSum - oldValue) + effectiveOffset + newValue;
        const nextCount = contributionCount
            - Number(Math.abs(oldValue) >= CONTRIBUTION_EPSILON)
            + Number(Math.abs(newValue) >= CONTRIBUTION_EPSILON);

        if (nextCount < 0) {
            throw new Error(`Tag preference contribution count is invalid for ${tag}`);
        }
        if (nextCount === 0) {
            delete tags[tag];
        } else {
            const nextScale = Math.abs(nextSum) >= CONTRIBUTION_EPSILON
                ? nextEvidence / nextSum
                : effectiveScale;
            const nextOffset = Math.abs(nextSum) >= CONTRIBUTION_EPSILON ? 0 : nextEvidence;
            tags[tag] = {
                weight: bounded_weight(nextEvidence),
                updated_at: updatedAt,
                evidence_sum: nextSum,
                evidence_scale: nextScale,
                evidence_offset: nextOffset,
                contribution_count: nextCount
            };
        }
        changed = true;
    }

    if (!changed) return { preferences: preferencesValue, changed: false };

    preferences.recommendation = {
        ...recommendation,
        tags
    };
    return { preferences, changed: true };
}

function createTagPreferenceService({ UserBookPreferenceSignal }) {
    async function update_book_signals({
        user,
        bookId,
        tags,
        oldSources,
        newSources,
        transaction,
        now = new Date()
    }) {
        const ledger = await UserBookPreferenceSignal.findOne({
            where: { user_id: user.id, book_id: bookId },
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        const oldContributions = ledger
            ? parse_contributions(ledger.contributions)
            : build_book_contributions(tags, oldSources);
        const newContributions = build_book_contributions(tags, newSources);
        const signalChanged = !same_contributions(oldContributions, newContributions);

        if (!ledger && Object.keys(oldContributions).length > 0) {
            const error = new Error('Tag preference backfill must run before updating existing interactions');
            error.code = 'TAG_PREFERENCE_BACKFILL_REQUIRED';
            throw error;
        }

        const preferencesBefore = parse_preferences(user.preferences);
        const recommendationBefore = preferencesBefore.recommendation || {};
        const result = apply_contribution_delta(user.preferences, oldContributions, newContributions, now);
        const preferences = result.changed ? result.preferences : preferencesBefore;
        preferences.recommendation = {
            ...(preferences.recommendation || {}),
            signals_initialized: true
        };

        if (result.changed || !recommendationBefore.signals_initialized) {
            user.preferences = preferences;
            await user.save({ transaction, fields: ['preferences'] });
        }

        if (signalChanged) {
            if (Object.keys(newContributions).length === 0) {
                if (ledger) await ledger.destroy({ transaction });
            } else if (ledger) {
                ledger.contributions = newContributions;
                await ledger.save({ transaction });
            } else {
                await UserBookPreferenceSignal.create({
                    user_id: user.id,
                    book_id: bookId,
                    contributions: newContributions
                }, { transaction });
            }
        }

        return { changed: result.changed, contributions: newContributions };
    }

    return { update_book_signals };
}

function build_initial_preferences(contributionsByBook, now = new Date()) {
    const evidence = new Map();
    const contributionCounts = new Map();
    const rows = [];

    for (const [bookId, rawContributions] of contributionsByBook) {
        const contributions = parse_contributions(rawContributions);
        if (Object.keys(contributions).length === 0) continue;
        rows.push({
            book_id: Number(bookId),
            contributions
        });
        for (const [tag, contribution] of Object.entries(contributions)) {
            evidence.set(tag, (evidence.get(tag) || 0) + contribution);
            contributionCounts.set(tag, (contributionCounts.get(tag) || 0) + 1);
        }
    }

    const updatedAt = now.toISOString();
    const tags = Object.fromEntries([...evidence.entries()].map(([tag, evidenceSum]) => [
        tag,
        {
            weight: bounded_weight(evidenceSum),
            updated_at: updatedAt,
            evidence_sum: evidenceSum,
            evidence_scale: 1,
            evidence_offset: 0,
            contribution_count: contributionCounts.get(tag)
        }
    ]));

    return { rows, tags };
}

module.exports = {
    DECAY_PERIOD_DAYS,
    DECAY_RETENTION,
    RATING_IMPACTS,
    WEIGHT_LIMIT,
    apply_contribution_delta,
    build_book_contributions,
    build_initial_preferences,
    createTagPreferenceService,
    decay_factor,
    effective_weight,
    normalize_tag,
    normalize_tags,
    parse_contributions,
    parse_preferences
};
