import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BookCard from "./cardLibro";
import "../pagescss/carrouselLibros.css";

export default function BookList({ libros, onBookClick }) {
    const scrollRef = useRef(null);
    const [navigation, setNavigation] = useState({ left: false, right: false });

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return undefined;

        const updateNavigation = () => {
            const maxScrollLeft = element.scrollWidth - element.clientWidth;
            const nextNavigation = {
                left: element.scrollLeft > 1,
                right: maxScrollLeft - element.scrollLeft > 1,
            };

            setNavigation((current) => (
                current.left === nextNavigation.left && current.right === nextNavigation.right
                    ? current
                    : nextNavigation
            ));
        };

        updateNavigation();
        element.addEventListener("scroll", updateNavigation, { passive: true });
        window.addEventListener("resize", updateNavigation);

        const resizeObserver = typeof ResizeObserver === "undefined"
            ? null
            : new ResizeObserver(updateNavigation);
        resizeObserver?.observe(element);
        if (element.parentElement) resizeObserver?.observe(element.parentElement);

        return () => {
            element.removeEventListener("scroll", updateNavigation);
            window.removeEventListener("resize", updateNavigation);
            resizeObserver?.disconnect();
        };
    }, [libros]);

    if (!Array.isArray(libros) || libros.length === 0) {
        return (
            <div className="book-carousel-empty">
                No hay libros para mostrar.
            </div>
        );
    }

    const scrollByCards = (direction) => {
        const element = scrollRef.current;
        if (!element) return;

        const firstCard = element.querySelector(".book-card");
        const cardWidth = firstCard?.getBoundingClientRect().width || element.clientWidth;
        const gap = Number.parseFloat(window.getComputedStyle(element).columnGap) || 0;
        const cardStride = cardWidth + gap;
        const visibleCards = Math.max(1, Math.floor(element.clientWidth / cardStride));
        const distance = Math.max(cardStride, (visibleCards - 1) * cardStride);
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth";

        element.scrollBy({ left: direction * distance, behavior });
    };

    return (
        <section className="book-carousel" aria-label="Libros">
            {navigation.left && (
                <button
                    className="scroll-btn left"
                    type="button"
                    onClick={() => scrollByCards(-1)}
                    aria-label="Desplazar libros a la izquierda"
                >
                    <ChevronLeft size={23} aria-hidden="true" />
                </button>
            )}

            <div className="book-scroll-wrapper">
                <div className="book-scroll" ref={scrollRef} tabIndex={0} aria-label="Lista horizontal de libros">
                    {libros.map((b) => (
                        <BookCard key={b.id ?? b.id_libro ?? b.book_id} book={b} onClick={onBookClick} />
                    ))}
                </div>
            </div>

            {navigation.right && (
                <button
                    className="scroll-btn right"
                    type="button"
                    onClick={() => scrollByCards(1)}
                    aria-label="Desplazar libros a la derecha"
                >
                    <ChevronRight size={23} aria-hidden="true" />
                </button>
            )}
        </section>
    );
}
