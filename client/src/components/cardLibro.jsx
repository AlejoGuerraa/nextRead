import { useState } from "react";
import { BookOpen } from "lucide-react";

const ratingFormatter = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

export default function BookCard({ book, onClick }) {
    const [failedCover, setFailedCover] = useState(null);
    const id = book.id ?? book.id_libro ?? book.book_id ?? null;

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

    const rawRating = book.average_rating ?? book.ranking;
    const parsedRating = typeof rawRating === "number" || (typeof rawRating === "string" && rawRating.trim())
        ? Number(rawRating)
        : NaN;
    const rating = Number.isFinite(parsedRating) && parsedRating >= 1 && parsedRating <= 5
        ? parsedRating
        : null;
    const ratingLabel = rating === null ? null : ratingFormatter.format(rating);
    const ratingHue = rating === null ? null : Math.round(((rating - 1) / 4) * 42);
    const hasCover = Boolean(cover && failedCover !== cover);

    return (
        <button
            className="book-card"
            type="button"
            onClick={() => onClick?.(id)}
            disabled={!id || !onClick}
            aria-label={`Ver detalles de ${title}`}
        >
            <span className="book-cover-media">
                {hasCover ? (
                    <img
                        src={cover}
                        alt={`Portada de ${title}`}
                        loading="lazy"
                        decoding="async"
                        onError={() => setFailedCover(cover)}
                    />
                ) : (
                    <span className="book-cover-placeholder">
                        <BookOpen size={30} aria-hidden="true" />
                        <span>Portada no disponible</span>
                    </span>
                )}
            </span>
            <span className="book-card-shade" aria-hidden="true" />
            <span className="book-meta">
                <span className="book-title">{title}</span>
                <span className="book-byline">
                    <span className="book-author">{author}</span>
                    {rating === null ? (
                        <span className="book-rating" aria-label="Sin valoraciones">Sin valoraciones</span>
                    ) : (
                        <span
                            className="book-rating"
                            style={{ "--rating-hue": ratingHue }}
                            aria-label={`Valoración global ${ratingLabel} sobre 5`}
                        >
                            {ratingLabel} <span aria-hidden="true">★</span>
                        </span>
                    )}
                </span>
            </span>
        </button>
    );
}
