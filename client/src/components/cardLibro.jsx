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

    // 🔹 Normalizar rating a INT entre 0 y 5 — usar rawRating en todo el cálculo
    let rawRating = book.puntuacion_usuario ?? book.puntuacion ?? book.ranking ?? 0;
    const parsed = Number(rawRating); // convierte "4" o "4.2" a número (NaN si no se puede)

    const rating = Number.isFinite(parsed)
        ? Math.max(0, Math.min(5, Math.floor(parsed))) // int 0..5
        : 0;

    // Para debugging rápido (comentá cuando no lo necesites)
    // console.log("BookCard", { id, titulo: title, rawRating, parsed, rating, book });

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
                {"★".repeat(rating)}{"☆".repeat(5 - rating)} ({rating})
            </span>
        </div>
    );
}
