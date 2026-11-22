const MAX_CAROUSEL_BOOKS = 20;
const MAX_BOOKS_PER_AUTHOR = 3;
const MIN_CAROUSEL_BOOKS = 3;
const MAX_GENRE_CAROUSELS = 3;
const EXPLORATION_RATIO = 0.2;
const MINIMUM_QUALITY_RANKING = 3.0;

function parse_array(value) {
    if (typeof value === 'string') {
        try {
            value = JSON.parse(value);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(value)) return [];
    return value.filter((entry) => typeof entry === 'string' && entry.trim())
        .map((entry) => entry.trim());
}

function normalize_group_key(value) {
    return String(value)
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function numeric_value(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function boolean_value(value) {
    return value === true || value === 1 || value === '1';
}

function normalize_candidates(rows) {
    const candidates = [];
    const seenBookIds = new Set();
    for (const row of Array.isArray(rows) ? rows : []) {
        if (!row || typeof row !== 'object') continue;
        const id = Number(row.id);
        const position = Number(row.position);
        const score = numeric_value(row.score);
        if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(position) || position <= 0 || score === null) {
            continue;
        }
        if (seenBookIds.has(id)) continue;
        seenBookIds.add(id);

        candidates.push({
            id,
            titulo: row.titulo,
            url_portada: row.url_portada || null,
            nombre_autor: row.nombre_autor || null,
            id_autor: numeric_value(row.id_autor),
            position,
            score,
            is_exploration: boolean_value(row.is_exploration),
            is_read: boolean_value(row.is_read),
            anio: numeric_value(row.anio),
            tipo: typeof row.tipo === 'string' ? row.tipo.trim() : '',
            tema: typeof row.tema === 'string' ? row.tema.trim() : '',
            generos: parse_array(row.generos),
            tags: parse_array(row.tags),
            ranking: numeric_value(row.ranking),
            read_count: numeric_value(row.read_count)
        });
    }
    return candidates.sort((left, right) =>
        left.position - right.position || left.id - right.id
    );
}

function create_selection_state() {
    return {
        books: [],
        bookIds: new Set(),
        authorCounts: new Map()
    };
}

function append_diverse_candidates(state, candidates, count, maxBooks = MAX_CAROUSEL_BOOKS) {
    let added = 0;
    for (const candidate of candidates) {
        if (added >= count || state.books.length >= maxBooks) break;
        if (state.bookIds.has(candidate.id)) continue;

        const authorKey = candidate.id_autor !== null
            ? String(candidate.id_autor)
            : candidate.nombre_autor
                ? `name:${normalize_group_key(candidate.nombre_autor)}`
                : `unknown:${candidate.id}`;
        const authorCount = state.authorCounts.get(authorKey) || 0;
        if (authorCount >= MAX_BOOKS_PER_AUTHOR) continue;

        state.bookIds.add(candidate.id);
        state.authorCounts.set(authorKey, authorCount + 1);
        state.books.push(candidate);
        added += 1;
    }
    return added;
}

function select_diverse_candidates(candidates, limit = MAX_CAROUSEL_BOOKS) {
    const state = create_selection_state();
    append_diverse_candidates(state, candidates, limit, limit);
    return state.books;
}

function to_book_card(candidate) {
    return {
        id: candidate.id,
        titulo: candidate.titulo,
        url_portada: candidate.url_portada,
        ranking: candidate.ranking,
        nombre_autor: candidate.nombre_autor
    };
}

function build_for_you(candidates) {
    const eligible = candidates.filter((candidate) =>
        !candidate.is_read &&
        candidate.ranking !== null &&
        candidate.ranking > MINIMUM_QUALITY_RANKING
    );
    const explorationCount = Math.round(MAX_CAROUSEL_BOOKS * EXPLORATION_RATIO);
    const personalizedCount = MAX_CAROUSEL_BOOKS - explorationCount;
    const state = create_selection_state();
    const personalized = eligible.filter((candidate) => !candidate.is_exploration);
    const exploration = eligible.filter((candidate) => candidate.is_exploration);
    if (personalized.length === 0) return [];

    append_diverse_candidates(state, personalized, personalizedCount);
    const proportionalExplorationCount = Math.min(
        explorationCount,
        Math.round(state.books.length * EXPLORATION_RATIO / (1 - EXPLORATION_RATIO))
    );
    append_diverse_candidates(state, exploration, proportionalExplorationCount);

    return state.books
        .sort((left, right) => left.position - right.position)
        .map(to_book_card);
}

function median(values) {
    const sorted = [...values].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
}

function percentile_ranks(candidates, field, ascending = false) {
    const sorted = [...candidates].sort((left, right) => {
        const difference = left[field] - right[field];
        return (ascending ? difference : -difference) ||
            left.position - right.position ||
            left.id - right.id;
    });
    const ranks = new Map();
    let start = 0;
    while (start < sorted.length) {
        let end = start;
        while (end + 1 < sorted.length && sorted[end + 1][field] === sorted[start][field]) {
            end += 1;
        }
        const averageRank = (start + end) / 2;
        const percentile = sorted.length <= 1
            ? 1
            : (sorted.length - 1 - averageRank) / (sorted.length - 1);
        for (let index = start; index <= end; index += 1) {
            ranks.set(sorted[index].id, percentile);
        }
        start = end + 1;
    }
    return ranks;
}

function build_jewels(candidates) {
    const eligible = candidates.filter((candidate) =>
        !candidate.is_read &&
        candidate.score > 0 &&
        candidate.ranking !== null &&
        candidate.ranking > MINIMUM_QUALITY_RANKING &&
        candidate.read_count !== null &&
        candidate.read_count >= 0
    );
    if (new Set(eligible.map((candidate) => candidate.read_count)).size < 2) return null;

    const popularityMedian = median(eligible.map((candidate) => candidate.read_count));
    const lowPopularity = eligible.filter((candidate) =>
        candidate.read_count <= popularityMedian
    );
    if (lowPopularity.length < MIN_CAROUSEL_BOOKS) return null;

    const affinityRanks = percentile_ranks(eligible, 'score');
    const qualityRanks = percentile_ranks(eligible, 'ranking');
    const popularityRanks = percentile_ranks(eligible, 'read_count', true);
    const ranked = lowPopularity
        .map((candidate) => ({
            ...candidate,
            jewel_score: (
                affinityRanks.get(candidate.id) +
                qualityRanks.get(candidate.id) +
                popularityRanks.get(candidate.id)
            ) / 3
        }))
        .sort((left, right) =>
            right.jewel_score - left.jewel_score ||
            left.position - right.position ||
            left.id - right.id
        );
    const books = select_diverse_candidates(ranked);
    if (books.length < MIN_CAROUSEL_BOOKS) return null;

    return {
        id: 'joyas-por-descubrir',
        title: 'Joyas escondidas',
        libros: books.map(to_book_card)
    };
}

function build_group_carousels(candidates, {
    idPrefix,
    titlePrefix = '',
    titleBuilder = null,
    getLabels,
    maxGroups = Number.POSITIVE_INFINITY
}) {
    const groups = new Map();
    for (const candidate of candidates) {
        if (candidate.is_read || candidate.score <= 0) continue;
        const labels = [...new Map(getLabels(candidate)
            .filter((label) => typeof label === 'string' && label.trim())
            .map((label) => [normalize_group_key(label), label.trim()])).values()];

        for (const label of labels) {
            const key = normalize_group_key(label);
            if (!key) continue;
            if (!groups.has(key)) groups.set(key, { key, label, candidates: [] });
            groups.get(key).candidates.push(candidate);
        }
    }

    return [...groups.values()]
        .map((group) => {
            const books = select_diverse_candidates(group.candidates);
            if (books.length < MIN_CAROUSEL_BOOKS) return null;
            const affinity = books.reduce((total, book) => total + book.score, 0) / books.length;
            return {
                id: `${idPrefix}-${group.key}`,
                title: titleBuilder ? titleBuilder(group.label, group.key) : `${titlePrefix}${group.label}`,
                libros: books.map(to_book_card),
                affinity,
                bookCount: books.length,
                key: group.key
            };
        })
        .filter(Boolean)
        .sort((left, right) =>
            right.affinity - left.affinity ||
            right.bookCount - left.bookCount ||
            left.key.localeCompare(right.key)
        )
        .slice(0, maxGroups)
        .map(({ affinity, bookCount, key, ...carousel }) => carousel);
}

function get_decade_labels(candidate) {
    if (candidate.anio === null || candidate.anio <= 0) return [];
    const decade = Math.floor(candidate.anio / 10) * 10;
    return candidate.tags.some((tag) => tag === String(decade))
        ? [`${decade}s`]
        : [];
}

function build_personalized_carousels(rows) {
    const candidates = normalize_candidates(rows);
    const carousels = [];
    const forYou = build_for_you(candidates);
    if (forYou.length >= MIN_CAROUSEL_BOOKS) {
        carousels.push({
            id: 'para-vos',
            title: 'Para vos',
            libros: forYou
        });
    }

    carousels.push(...build_group_carousels(candidates, {
        idPrefix: 'epoca',
        titleBuilder: (label) => {
            const decade = label.replace(/s$/, '').trim();
            return `Libros del ${decade} que te pueden atrapar`;
        },
        getLabels: get_decade_labels
    }));
    carousels.push(...build_group_carousels(candidates, {
        idPrefix: 'tipo',
        titleBuilder: (label) => {
            const normalized = label.trim().normalize('NFC').toLocaleLowerCase('es');
            const plural = /a$/i.test(normalized)
                ? `${normalized.slice(0, -1)}as`
                : /e$/i.test(normalized)
                    ? `${normalized}es`
                    : /o$/i.test(normalized)
                        ? `${normalized.slice(0, -1)}os`
                        : `${normalized}s`;
            return `Nuestra selección de ${plural}`;
        },
        getLabels: (candidate) => [candidate.tipo]
    }));
    carousels.push(...build_group_carousels(candidates, {
        idPrefix: 'genero',
        titlePrefix: 'Género: ',
        getLabels: (candidate) => candidate.generos,
        maxGroups: MAX_GENRE_CAROUSELS
    }));

    const jewels = build_jewels(candidates);
    if (jewels) carousels.push(jewels);

    carousels.push(...build_group_carousels(candidates, {
        idPrefix: 'tema',
        titlePrefix: '',
        getLabels: (candidate) => [candidate.tema]
    }));

    return carousels;
}

module.exports = {
    MAX_CAROUSEL_BOOKS,
    MAX_BOOKS_PER_AUTHOR,
    MIN_CAROUSEL_BOOKS,
    build_personalized_carousels,
    normalize_candidates,
    select_diverse_candidates
};
