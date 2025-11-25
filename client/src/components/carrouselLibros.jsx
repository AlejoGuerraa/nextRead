import React, { useRef } from "react";
import BookCard from "./cardLibro";
import "../pagescss/carrouselLibros.css";

export default function BookList({ libros, onBookClick }) {
    const scrollRef = useRef(null);

    if (!Array.isArray(libros) || libros.length === 0) {
        return (
            <div style={{ padding: 20, color: "#666" }}>
                No hay libros para mostrar.
            </div>
        );
    }

    const scrollLeft = () => {
        // Desplazar exactamente el ancho visible del contenedor menos el padding
        scrollRef.current.scrollBy({ left: -scrollRef.current.offsetWidth, behavior: "smooth" });
    };

    const scrollRight = () => {
        scrollRef.current.scrollBy({ left: scrollRef.current.offsetWidth, behavior: "smooth" });
    };

    return (
        <section style={{ marginTop: "30px", position: "relative" }}>
            <h2
                style={{
                    fontSize: "1.8rem",
                    fontWeight: "600",
                    marginBottom: "15px",
                    marginLeft: "20px",
                    color: "#222",
                }}
            >
                Novedades y Tendencias
            </h2>

            {/* Botón izquierdo */}
            <button className="scroll-btn left" onClick={scrollLeft}>
                ◀
            </button>

            <div className="book-scroll-wrapper">
                <div className="book-scroll" ref={scrollRef}>
                    {libros.map((b) => (
                        <BookCard key={b.id} book={b} onClick={onBookClick} />
                    ))}
                </div>
            </div>

            {/* Botón derecho */}
            <button className="scroll-btn right" onClick={scrollRight}>
                ▶
            </button>
        </section>
    );
}
