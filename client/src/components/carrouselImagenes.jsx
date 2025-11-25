import React, { useRef, useEffect, useState } from "react";
import "../pagescss/carrouselImagenes.css";

export default function Carousel({ slides }) {
    // Se Empieza directamente en la primera imagen real (indice 1).
    const [currentIndex, setCurrentIndex] = useState(1);
    const listRef = useRef(null);

    const extendedSlides = [
        slides[slides.length - 1], // clon último
        ...slides,
        slides[0] // clon primero
    ];

    // ---------------------------------------------
    // GESTION DEL MOVIMIENTO Y RESETEOS INSTANTANEOS
    // ---------------------------------------------
    useEffect(() => {
        const node = listRef.current;
        if (!node) return;

        // Si estamos en un clon, forzar el reseteo inmediato sin transicion.
        if (currentIndex === extendedSlides.length - 1) {
            // Mover al primer slide real (indice 1)
            node.style.transition = "none";
            node.style.transform = `translateX(-100%)`;
            // Establecer el estado real en el proximo microtask
            setTimeout(() => {
                setCurrentIndex(1);
            }, 0); 
            return;

        } else if (currentIndex === 0) {
            // Mover al ultimo slide real (indice slides.length)
            node.style.transition = "none";
            node.style.transform = `translateX(-${slides.length * 100}%)`;
            // Establecer el estado real en el proximo microtask
            setTimeout(() => {
                setCurrentIndex(slides.length);
            }, 0);
            return;
        }

        // --- Movimiento Normal (Cuando no es un clon) ---
        // Aplicar la transición CSS (tomada del CSS global)
        node.style.transition = ""; // Usar la transicion definida en el CSS
        node.style.transform = `translateX(-${currentIndex * 100}%)`;

    }, [currentIndex, slides.length, extendedSlides.length]); 


    // ---------------------------------------------
    // AUTOPLAY (Mantener el movimiento)
    // ---------------------------------------------
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => prev + 1);
        }, 5000);
        
        // CORRECCIÓN BUG DE INACTIVIDAD (Solucion de contingencia)
        // Ya que la logica de reseteo está en el useEffect principal, 
        // este listener simplemente asegura que React recalcule el estado 
        // si la pestaña está inactiva y vuelve, forzando la ejecución del useEffect principal.
        const handleFocus = () => {
            if (listRef.current && listRef.current.style.transition === 'none') {
                // Si el carrusel se quedo sin transicion (porque estaba en reseteo),
                // lo forzamos a un indice para que el useEffect re-calcule.
                setCurrentIndex(currentIndex); 
            }
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        }
    }, [currentIndex]); // Añadimos currentIndex para que el listener se actualice

    // ---------------------------------------------
    // Los Dots (No necesitan cambio, ya estan bien)
    // ---------------------------------------------
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
                    // Calculo del índice real para los dots:
                    // Si está en el clon final (extended.len - 1), el índice real es 0.
                    // Si está en el clon inicial (0), el índice real es slides.length - 1.
                    const realIndex =
                        currentIndex === extendedSlides.length - 1
                            ? 0
                            : currentIndex === 0
                            ? slides.length - 1
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