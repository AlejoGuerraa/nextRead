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
        book.autor ||
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
        null;

    return (
        <div className="book-card" onClick={() => onClick(id)}>
            <div className="book-cover">
                {cover ? <img src={cover} alt={title} /> : <div className="placeholder">📘</div>}
            </div>

            <div className="book-info">
                <h4>{title}</h4>
                <p>{author}</p>
            </div>

            <div className="book-stars">
                {rating
                    ? "★".repeat(Math.round(rating)).slice(0,5) +
                      "☆".repeat(5 - Math.round(rating))
                    : "—"}
            </div>
        </div>
    );
}