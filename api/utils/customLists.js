function parse_custom_lists(value) {
    let lists = value;
    if (typeof lists === 'string') {
        try {
            lists = JSON.parse(lists);
        } catch {
            return {};
        }
    }
    if (!lists || typeof lists !== 'object' || Array.isArray(lists)) return {};

    return Object.fromEntries(Object.entries(lists).map(([name, entry]) => {
        const books = Array.isArray(entry) ? entry : entry?.libros;
        return [name, {
            libros: Array.isArray(books)
                ? books.map(Number).filter(Number.isInteger)
                : [],
            isPrivate: entry && !Array.isArray(entry) ? entry.isPrivate === true : false
        }];
    }));
}

module.exports = { parse_custom_lists };
