import React, { useState, useEffect, useRef } from "react";

// 1. Data Mockeada
const mockCarouselData = [
    { id: 1, imgUrl: "https://placehold.co/1000x350/81C784/ffffff?text=Ficcion+Clasica" },
    { id: 2, imgUrl: "https://placehold.co/1000x350/64B5F6/ffffff?text=Misterio+y+Thriller" },
    { id: 3, imgUrl: "https://placehold.co/1000x350/FFB74D/ffffff?text=Ciencia+Ficcion" },
    { id: 4, imgUrl: "https://placehold.co/1000x350/E57373/ffffff?text=Romance+Historico" },
];

// --- 2. DEFINICIÓN DE CONSTANTES DE ESTILO ---
const iconStyle = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.2rem",
    cursor: "pointer",
    transition: "background-color 0.2s",
    color: "#fff",
    position: 'relative',
    zIndex: 1001,
};

const sliderContainerStyle = {
    position: "relative",
    maxWidth: "1000px",
    margin: "0 auto",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 5px 15px rgba(0,0,0,0.15)",
    height: "350px",
};

const containerImagesStyle = {
    width: "100%",
    height: "100%",
};

const ulStyle = {
    display: "flex",
    padding: "0",
    margin: "0",
    listStyle: "none",
    width: `${mockCarouselData.length * 1000}px`,
    height: "100%",
    overflowX: "hidden",
    whiteSpace: "nowrap",

    transition: 'transform 0.5s ease-in-out',
};

const liStyle = {
    flexShrink: 0,
    width: "1000px",
    height: "100%",
    display: "inline-block",
    textAlign: "center",
};

const imgStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
};

const dotsContainerStyle = {
    position: "absolute",
    bottom: "15px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "8px",
    zIndex: 10,
};

const dotStyle = (isActive) => ({
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: isActive ? "#0a6fb4" : "rgba(255, 255, 255, 0.7)",
    cursor: "pointer",
    transition: "background-color 0.3s",
    border: "1px solid #fff",
});

const ARROW_MARGIN = "30px";
const arrowStyle = (direction, isDisabled) => ({
    position: "absolute",
    top: "50%",
    [direction]: ARROW_MARGIN,
    transform: "translateY(-50%)",
    backgroundColor: isDisabled ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.5)",
    color: "white",
    padding: "10px",
    borderRadius: "50%",
    cursor: isDisabled ? "default" : "pointer",
    zIndex: 5,
    fontSize: "1.2rem",
    opacity: isDisabled ? 0.5 : 1,
    transition: "opacity 0.3s, background-color 0.3s",

    width: "40px", 
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
});

// --- ESTILO: POPUP DE RESTRICCIÓN (Base sin opacidad) ---
const restrictionPopoverStyle = {
    position: "absolute",
    right: "0px",
    top: "calc(100% + 15px)",
    backgroundColor: "#fff",
    border: "2px solid #0a6fb4",
    borderRadius: "10px",
    padding: "15px 20px",
    boxShadow: "0 6px 15px rgba(0, 0, 0, 0.3)",
    zIndex: 9999,
    width: "220px",
    textAlign: "center",
    transition: "opacity 0.3s ease-in-out",
    visibility: "visible",
};

const popoverLinkStyle = {
    color: "#0a6fb4",
    fontWeight: "700",
    textDecoration: "underline",
    display: "block",
    marginTop: "5px",
    cursor: "pointer",
};

// --- 3. Componente principal Invitado ---
const Invitado = () => {

    const [showRestriction, setShowRestriction] = useState(false);
    const headerRightRef = useRef(null)
    const [popoverKey, setPopoverKey] = useState(0);
    const [popoverOpacity, setPopoverOpacity] = useState(0);

    const [searchTerm, setSearchTerm] = useState("");
    const trendingBooks = [
        { title: "El Alquimista", author: "P. Coelho", rating: 4.3 },
        { title: "Cien Años", author: "G. G. Márquez", rating: 3.7 },
        { title: "1984", author: "George Orwell", rating: 4.9 },
        { title: "Harry Potter 1", author: "J.K. Rowling", rating: 4.1 },
        { title: "Orgullo y Prejuicio", author: "J. Austen", rating: 3.9 },
        { title: "Don Quijote", author: "M. de Cervantes", rating: 4.6 },
    ];

    // Logica del Carrusel
    const listRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const SLIDE_WIDTH = 1000; // Ancho de cada slide (de liStyle)

    useEffect(() => {
        const listNode = listRef.current;
        if (listNode) {
            listNode.style.transform = `translateX(-${currentIndex * SLIDE_WIDTH}px)`;
        }
    }, [currentIndex]);


    const scrollToImage = (direction) => {
        const totalSlides = mockCarouselData.length;
        if (direction === "prev") {
            
            setCurrentIndex((curr) => (curr === 0 ? 0 : curr - 1));
        } else {
            
            setCurrentIndex((curr) =>
                curr === totalSlides - 1 ? totalSlides - 1 : curr + 1
            );
        }
    };

    const goToSlide = (slideIndex) => {
        setCurrentIndex(slideIndex);
    };


    // logica de Restriccion/Popover
    const handleRestrictedClick = (e) => {
        e.preventDefault();
        setShowRestriction(false);
        setPopoverOpacity(0);
        setPopoverKey(prevKey => prevKey + 1);
        setTimeout(() => {
            setShowRestriction(true);
            setPopoverOpacity(1);
        }, 5);
    };

    useEffect(() => {
        const justReturned = sessionStorage.getItem('justReturnedFromRegistration');

        if (justReturned === 'true') {
            setShowRestriction(true);
            setPopoverOpacity(0);
            setPopoverKey(prevKey => prevKey + 1);
            setTimeout(() => setPopoverOpacity(1), 5);

            sessionStorage.removeItem('justReturnedFromRegistration');
        }

        const handleClickOutside = (event) => {
            if (headerRightRef.current && !headerRightRef.current.contains(event.target)) {
                setPopoverOpacity(0);
                setTimeout(() => setShowRestriction(false), 300);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    //--------------------------------------------------------------------
    return (
        <div
            style={{
                fontFamily: "Inter, sans-serif",
                backgroundColor: "#f0f4f8",
                minHeight: "100vh",
            }}
        >
            {/* HEADER */}
            <header
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 25px",
                    backgroundColor: "#4c6ca3",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    color: "#fff",
                }}
            >
                {/* Izquierda (Logo y Busqueda) */}
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div
                        style={{
                            width: "45px",
                            height: "45px",
                            borderRadius: "50%",
                            backgroundColor: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem",
                            color: "#4c6ca3",
                            boxShadow: "0 0 5px rgba(0,0,0,0.2)",
                        }}
                    >
                        📚
                    </div>

                    <span
                        style={{
                            fontWeight: "800",
                            fontSize: "1.4rem",
                            color: "#fff",
                        }}
                    >
                        NextRead
                    </span>

                    <input
                        type="text"
                        placeholder="Buscar libros..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: "8px 15px",
                            borderRadius: "20px",
                            border: "none",
                            outline: "none",
                            width: "250px",
                            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                        }}
                    />
                </div>

                {/* DERECHA - CONTENEDOR FUNCIONAL (sin cambios) */}
                <div
                    ref={headerRightRef}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                        position: 'relative',
                    }}
                >
                    {/* iconos de Notificaciones, Amigos, Perfil (con handleRestrictedClick) */}
                    <div
                        style={iconStyle}
                        onClick={handleRestrictedClick}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; }}
                    >🔔
                    </div>

                    <div
                        style={iconStyle}
                        onClick={handleRestrictedClick}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; }}
                    >
                        <span style={{
                            transform: 'translateY(-4.5px)',
                            display: 'inline-block',
                            fontSize: '1.7rem'
                        }}>
                            👥
                        </span>
                    </div>

                    <div
                        style={iconStyle}
                        onClick={handleRestrictedClick}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; }}
                    >
                        <span style={{
                            transform: 'translateY(-1.2px)',
                            display: 'inline-block',
                            fontSize: '1.4rem'
                        }}>
                            👤
                        </span>
                    </div>

                    {/* EL POPOVER (con Fade-in y Key) */}
                    {showRestriction && (
                        <div
                            key={popoverKey}
                            style={{
                                ...restrictionPopoverStyle,
                                opacity: popoverOpacity,
                                pointerEvents: popoverOpacity === 1 ? 'auto' : 'none',
                            }}
                        >
                            <p style={{ margin: 0, fontWeight: '500', color: '#333' }}>
                                ¡Necesitas una cuenta!
                            </p>
                            <a
                                href="/acceso"
                                style={popoverLinkStyle}
                                onClick={() => {
                                    sessionStorage.setItem('justReturnedFromRegistration', 'true');
                                }}
                            >
                                Accede aquí
                            </a>
                        </div>
                    )}
                </div>
            </header>

            <main style={{ padding: "30px 30px", maxWidth: "1200px", margin: "0 auto", backgroundColor: "#fff" }}>
                
                {/* Carrusel/Slider*/}
                <div className="slider-container" style={sliderContainerStyle}>
                    <div
                        className="leftArrow"
                        onClick={() => scrollToImage("prev")}
                        style={arrowStyle("left", currentIndex === 0)}
                    >
                        &#10092;
                    </div>
                    <div
                        className="rightArrow"
                        onClick={() => scrollToImage("next")}
                        style={arrowStyle("right", currentIndex === mockCarouselData.length - 1)}
                    >
                        &#10093;
                    </div>

                    <div className="container-images" style={containerImagesStyle}>
                        <ul ref={listRef} style={ulStyle}>
                            {mockCarouselData.map((item) => (
                                <li key={item.id} style={liStyle}>
                                    <img src={item.imgUrl} alt="Portada de libro" style={imgStyle} />
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Dots del Carrusel */}
                    <div className="dots-container" style={dotsContainerStyle}>
                        {mockCarouselData.map((_, idx) => (
                            <div
                                key={idx}
                                className={`dot-container-item ${idx === currentIndex ? "active" : ""}`}
                                onClick={() => goToSlide(idx)}
                                style={dotStyle(idx === currentIndex)}
                            ></div>
                        ))}
                    </div>
                </div>

                {/* Seccion de Tendencias / Novedades */}
                <section style={{ marginTop: "40px" }}>
                    <h3
                        style={{
                            marginBottom: "15px",
                            color: "#333",
                            fontWeight: "700",
                            fontSize: "1.8rem",
                        }}
                    >
                        Tendencias y Novedades
                    </h3>

                    {/* Dropdown*/}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: "-40px",
                            marginBottom: "30px",
                            position: "relative",
                            zIndex: 10,
                        }}
                    >
                        <select
                            style={{
                                padding: "8px 13px",
                                borderRadius: "20px",
                                border: "1px solid #7683a4",
                                backgroundColor: "#fff",
                                color: "#333",
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                outline: "none",
                            }}
                        >
                            <option>Género...</option>
                            <option>Terror</option>
                            <option>Romance</option>
                            <option>Clásicos</option>
                        </select>
                    </div>

                    {/* Carril de tarjetas de libros*/}
                    <div
                        style={{
                            display: "flex",
                            gap: "25px",
                            overflowX: "scroll",
                            backgroundColor: "#f8f8f8",
                            padding: "20px 25px 25px 25px",
                            margin: "10px -20px 0 -20px",
                            borderRadius: "10px",
                            paddingBottom: "19px",
                            msOverflowStyle: "none",
                            scrollbarWidth: "none",
                            WebkitOverflowScrolling: "touch",
                        }}
                        className="hide-scrollbar"
                    >
                        {trendingBooks.map((book, index) => (
                            <div
                                key={index}
                                style={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "12px",
                                    padding: "15px",
                                    minWidth: "160px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    transition: "transform 0.3s, box-shadow 0.3s",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-5px)";
                                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                                }}
                            >
                                <div
                                    style={{
                                        width: "100px",
                                        height: "140px",
                                        backgroundColor: "#e8edf3",
                                        borderRadius: "8px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "2rem",
                                        marginBottom: "10px",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                    }}
                                >
                                    📖
                                </div>

                                <span
                                    style={{
                                        fontWeight: "700",
                                        fontSize: "1rem",
                                        color: "#333",
                                        textAlign: "center",
                                        lineHeight: "1.2",
                                    }}
                                >
                                    {book.title}
                                </span>
                                <span
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "#666",
                                        marginBottom: "5px",
                                    }}
                                >
                                    {book.author}
                                </span>
                                <span
                                    style={{
                                        fontSize: "1rem",
                                        color: "#ffc107",
                                        margin: "3px 0",
                                    }}
                                >
                                    {"★".repeat(Math.round(book.rating))}
                                    {"☆".repeat(5 - Math.round(book.rating))} ({book.rating})
                                </span>
                                <button
                                    style={{
                                        marginTop: "10px",
                                        // 🚨 VERIFICADO: Usa tu color de acento azul
                                        backgroundColor: "#0a6fb4",
                                        color: "#fff",
                                        border: "none",
                                        padding: "6px 15px",
                                        borderRadius: "20px",
                                        cursor: "pointer",
                                        fontSize: "0.85rem",
                                        fontWeight: "600",
                                        transition: "background-color 0.2s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#084e82")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0a6fb4")}
                                >
                                    Ver Perfil
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <style>
                {`
            .hide-scrollbar::-webkit-scrollbar {
                display: none;
                
            }
            
            select option:checked, select option:hover {
                background-color: #0a6fb4 !important; /* Color de tu app */
                color: #fff !important; 
            }
            select option {
                background-color: #fff !important;
                color: #333 !important;
            }
            `}
            </style>
        </div>
    );
};

export default Invitado;