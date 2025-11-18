import React, { useRef, useEffect, useState } from "react";
import "../pagescss/carrouselImagenes.css";

export default function Carousel({ slides }) {
    const [currentIndex, setCurrentIndex] = useState(1); 
    const listRef = useRef(null);

    const extendedSlides = [
        slides[slides.length - 1], // clon último
        ...slides,
        slides[0] // clon primero
    ];

    // Mover con transición
    useEffect(() => {
        const node = listRef.current;
        if (!node) return;

        node.style.transition = "transform 0.6s ease-in-out";
        node.style.transform = `translateX(-${currentIndex * 100}%)`;
    }, [currentIndex]);

    // Detectar cuando esta en un slide clonado para resetear
    useEffect(() => {
        const node = listRef.current;
        if (!node) return;

        const handleTransitionEnd = () => {
            if (currentIndex === extendedSlides.length - 1) {
                node.style.transition = "none"; 
                setCurrentIndex(1); 
                node.style.transform = `translateX(-100%)`;
            }

            if (currentIndex === 0) {
                node.style.transition = "none";
                setCurrentIndex(slides.length);
                node.style.transform = `translateX(-${slides.length * 100}%)`;
            }
        };

        node.addEventListener("transitionend", handleTransitionEnd);
        return () => node.removeEventListener("transitionend", handleTransitionEnd);
    }, [currentIndex, slides.length]);

    // Autoplay
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => prev + 1);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="slider-container">
            <div className="container-images">
                <ul ref={listRef}>
                    {extendedSlides.map((s, i) => (
                        <li key={i}>
                            <img src={s.imgUrl} alt="" />
                        </li>
                    ))}
                </ul>
            </div>

            {/* Dots normales */}
            <div className="dots-container">
                {slides.map((_, i) => {
                    const realIndex =
                        currentIndex === 0
                            ? slides.length - 1
                            : currentIndex === extendedSlides.length - 1
                            ? 0
                            : currentIndex - 1;

                    return (
                        <div
                            key={i}
                            className={`dot ${i === realIndex ? "active" : ""}`}
                            onClick={() => setCurrentIndex(i + 1)}
                        ></div>
                    );
                })}
            </div>
        </div>
    );
}