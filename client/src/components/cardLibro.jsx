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
        book.autorData?.nombre ||
        "Autor desconocido";

    const cover =
        book.url_portada ||
        book.imagen ||
        book.cover ||
        null;

    const rating =
        book.puntuacion_usuario ??
        book.puntuacion ??
        book.ranking ??
        Math.floor(book.ranking || 0) ??
        null;

    return (
        <div className="book-card" onClick={() => onClick(book.id)}>
            {cover ? (
                <img src={cover} alt={title} className="book-cover-img" />
            ) : (
                <div className="book-cover-placeholder">📖</div>
            )}
            <span className="book-title">{title}</span>
            <span className="book-author">{author}</span>
            <span className="book-stars">
                {"★".repeat(rating)}{"☆".repeat(5 - rating)} ({rating ?? "0"})
            </span>
        </div>
    );
}