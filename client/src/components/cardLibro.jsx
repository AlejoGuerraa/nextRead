export default function BookCard({ book, onClick }) {
    const id =
        book.id ||
        book.id_libro ||
        book.book_id ||
        null;

    const title =
        book.titulo ||
        book.title ||
        "Sin título";

    const author =
        book.nombre_autor ||
        book.nombre ||
        book.Autor?.nombre ||
        book.autor?.nombre ||
        book.autorData?.nombre ||
        book.author?.name ||
        "Autor desconocido";

    const cover =
        book.url_portada ||
        book.imagen ||
        book.cover ||
        null;

    const rawRating =
        book.puntuacion_usuario ??
        book.puntuacion ??
        book.ranking ??
        (typeof book.ranking === 'number' ? Math.floor(book.ranking) : null);

    const rating = Number.isFinite(Number(rawRating))
        ? Math.max(0, Math.min(5, Math.floor(Number(rawRating))))
        : null;

    const starsCount = rating ?? 0;

    return (
        <div className="book-card" onClick={() => onClick(id)}>
            {cover ? (
                <img src={cover} alt={title} className="book-cover-img" />
            ) : (
                <div className="book-cover-placeholder">📖</div>
            )}
            <span className="book-title">{title}</span>
            <span className="book-author">{author}</span>
            <span className="book-stars">
                {"★".repeat(starsCount)}{"☆".repeat(5 - starsCount)} ({rating ?? "0"})
            </span>
        </div>
    );
}