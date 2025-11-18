// BookCard.jsx
import { useState, useEffect, useRef } from "react";

export default function BookCard({ book, onClick }) {
    const stars = Math.floor(book.ranking || 0);
    return (
        <div className="book-card" onClick={() => onClick(book.id)}>
            {book.url_portada ? (
                <img src={book.url_portada} alt={book.titulo} className="book-cover-img" />
            ) : (
                <div className="book-cover-placeholder">📖</div>
            )}
            <span className="book-title">{book.titulo}</span>
            <span className="book-author">{book.Autor ? book.Autor.nombre : "Autor desconocido"}</span>
            <span className="book-stars">
                {"★".repeat(stars)}{"☆".repeat(5 - stars)} ({book.ranking ?? "0"})
            </span>
        </div>
    );
}
