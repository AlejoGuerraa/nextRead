// src/pages/principal.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

import Header from "../components/header";
import Carousel from "../components/carrouselImagenes";
import BookList from "../components/carrouselLibros";
import Footer from "../components/footer";
import RestrictionPopover from "../components/popOver";

import "../pagescss/principal.css";

import carrousel1 from "../assets/carrousel/carrousel1.jpeg";
import carrousel2 from "../assets/carrousel/carrousel2.jpeg";
import carrousel3 from "../assets/carrousel/carrousel3.jpeg";
import carrousel4 from "../assets/carrousel/carrousel4.jpeg";

const mockCarouselData = [
  { id: 1, imgUrl: carrousel1 },
  { id: 2, imgUrl: carrousel2 },
  { id: 3, imgUrl: carrousel3 },
  { id: 4, imgUrl: carrousel4 },
];

export default function Principal() {
  const [user, setUser] = useState(null);
  const [libros, setLibros] = useState([]);
  const [generoSeleccionado, setGeneroSeleccionado] = useState("Género...");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Popover / restricción
  const headerRightRef = useRef(null);
  const popoverRef = useRef(null);            // <-- nuevo
  const [showRestriction, setShowRestriction] = useState(false);
  const [popoverKey, setPopoverKey] = useState(0);
  const [popoverOpacity, setPopoverOpacity] = useState(0);

  // titulo pestaña
  useEffect(() => {
    document.title = "NextRead - Inicio";
  }, []);

  // Cargar user desde localStorage pero NO redireccionar: queremos que la página funcione para invitados.
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  // fetch tendencias
  useEffect(() => {
    const fetchTendencias = async () => {
      try {
        const params = {};
        if (generoSeleccionado && generoSeleccionado !== "Género...") params.genero = generoSeleccionado;
        const res = await axios.get("http://localhost:3000/nextread/tendencias", { params });
        setLibros(res.data || []);
      } catch (e) {
        console.error("Error cargando los libros:", e);
        setLibros([]);
      }
    };
    fetchTendencias();
  }, [generoSeleccionado]);

  // Mostrar popover con fade-in
  const showRestrictionPopover = () => {
    setPopoverKey((k) => k + 1);
    setShowRestriction(false);
    setPopoverOpacity(0);
    // small delay to restart animation
    setTimeout(() => {
      setShowRestriction(true);
      setTimeout(() => setPopoverOpacity(1), 10);
    }, 8);
  };

  // callback que se pasa al Header: Header llamará esto cuando el usuario no esté logueado y clickee iconos
  const handleRestrictedAction = () => {
    showRestrictionPopover();
  };

  // cerrar popover al click fuera (AHORA usa 'click' y respeta popoverRef)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      const clickedInsideHeaderRight = headerRightRef.current && headerRightRef.current.contains(target);
      const clickedInsidePopover = popoverRef.current && popoverRef.current.contains(target);

      if (!clickedInsideHeaderRight && !clickedInsidePopover) {
        setPopoverOpacity(0);
        setTimeout(() => setShowRestriction(false), 240);
      }
    };

    // Escuchamos 'click' (no 'mousedown') para que los onClick del propio popover se ejecuten primero.
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleBookCardClick = (bookId) => {
    window.location.href = `/libro/${bookId}`;
  };

  return (
    <div className="logueado-container">
      {/* PASAMOS headerRightRef y el callback para restricciones */}
      <Header
        user={user}
        onRestrictedAction={handleRestrictedAction}
        headerRightRef={headerRightRef}
      />

      {/* Renderizamos el popover desde la página (posicionado relativo al headerRightRef) */}
      {showRestriction && headerRightRef.current && (
        <div
          key={popoverKey}
          ref={popoverRef}                        // <-- asignamos ref aquí
          className="restriction-popover-wrapper"
          style={{
            opacity: popoverOpacity,
            pointerEvents: popoverOpacity === 1 ? "auto" : "none",
            position: "absolute",
            top: headerRightRef.current.getBoundingClientRect().bottom + window.scrollY + 8 + "px",
            left: headerRightRef.current.getBoundingClientRect().right + window.scrollX - 260 + "px",
            zIndex: 9999,
          }}
        >
          <RestrictionPopover />
        </div>
      )}

      <main className="logueado-main">
        <Carousel slides={mockCarouselData} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />

        <section className="book-section">
          <BookList libros={libros} onBookClick={handleBookCardClick} />
          <BookList libros={libros} onBookClick={handleBookCardClick} />
          <BookList libros={libros} onBookClick={handleBookCardClick} />
          <BookList libros={libros} onBookClick={handleBookCardClick} />
          <BookList libros={libros} onBookClick={handleBookCardClick} />
          <BookList libros={libros} onBookClick={handleBookCardClick} />
          <BookList libros={libros} onBookClick={handleBookCardClick} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
