import React, { useRef, useEffect } from "react";
import "../pagescss/carrouselImagenes.css"; // importamos el CSS nuevo

export default function Carousel({ slides, currentIndex, setCurrentIndex }) {
    const listRef = useRef(null);

    useEffect(() => {
        const node = listRef.current;
        if (!node) return;
        const imgNode = node.children[currentIndex];
        if (imgNode) {
            imgNode.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center"
            });
        }
    }, [currentIndex]);


    const prev = () => setCurrentIndex((c) => Math.max(0, c - 1));
    const next = () => setCurrentIndex((c) => Math.min(slides.length - 1, c + 1));

    return (
        <div className="slider-container">
            <div className={`arrow left ${currentIndex === 0 ? "disabled" : ""}`} onClick={prev}>&#10092;</div>
            <div className={`arrow right ${currentIndex === slides.length - 1 ? "disabled" : ""}`} onClick={next}>&#10093;</div>

            <div className="container-images">
                <ul ref={listRef}>
                    {slides.map((s) => (
                        <li key={s.id}>
                            <img src={s.imgUrl} alt="" />
                        </li>
                    ))}
                </ul>
            </div>

            <div className="dots-container">
                {slides.map((_, i) => (
                    <div
                        key={i}
                        className={`dot ${i === currentIndex ? "active" : ""}`}
                        onClick={() => setCurrentIndex(i)}
                    ></div>
                ))}
            </div>
        </div>
    );
}
