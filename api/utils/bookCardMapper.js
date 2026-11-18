function map_book_rows_to_cards(rows) {
    return rows.map((row) => {
        const {
            author_id: authorId,
            author_name: authorName,
            author_face: authorFace,
            ...book
        } = row;

        return {
            ...book,
            Autor: authorId == null
                ? null
                : {
                    id: Number(authorId),
                    nombre: authorName,
                    url_cara: authorFace || null
                }
        };
    });
}

module.exports = { map_book_rows_to_cards };
