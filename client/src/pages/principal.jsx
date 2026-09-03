import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePrincipal } from '../hooks/usePrincipal';

import Header from '../components/header';
import Carousel from '../components/carrouselImagenes';
import BookList from '../components/carrouselLibros';
import Footer from '../components/footer';
import RestrictionPopover from '../components/popOver';

import '../pagescss/principal.css';

import fondo from '../assets/background/fondo.png';

import carrousel1 from '../assets/carrousel/carrouselPrincipito.jpg';
import carrousel2 from '../assets/carrousel/carrouselOrgulloYPrejuicio.jpg';
import carrousel3 from '../assets/carrousel/carrouselMetamorfosis.jpg';
import carrousel4 from '../assets/carrousel/carrouselElTunel.jpg';
import carrousel5 from '../assets/carrousel/carrousel1984.jpg';
import carrousel6 from '../assets/carrousel/carrouselTomie.jpg';
import carrousel7 from '../assets/carrousel/carrouselDorian.jpg';

const mockCarouselData = [
  { id: 263, imgUrl: carrousel1 },
  { id: 17, imgUrl: carrousel2 },
  { id: 25, imgUrl: carrousel3 },
  { id: 264, imgUrl: carrousel4 },
  { id: 69, imgUrl: carrousel5 },
  { id: 262, imgUrl: carrousel6 },
  { id: 62, imgUrl: carrousel7 },
];

export default function Principal() {
  const { user } = useAuth();
  const {
    generoSeleccionado,
    setGeneroSeleccionado,
    bookCarousels,
    ultimoLibroObj,
  } = usePrincipal(user);

  const [currentIndex, setCurrentIndex] = useState(0);
  const headerRightRef = useRef(null);
  const popoverRef = useRef(null);
  const [showRestriction, setShowRestriction] = useState(false);
  const [popoverKey, setPopoverKey] = useState(0);
  const [popoverOpacity, setPopoverOpacity] = useState(0);

  useEffect(() => {
    document.title = 'NextRead - Inicio';
  }, []);

  const showRestrictionPopover = () => {
    setPopoverKey((k) => k + 1);
    setShowRestriction(false);
    setPopoverOpacity(0);

    setTimeout(() => {
      setShowRestriction(true);
      setTimeout(() => setPopoverOpacity(1), 10);
    }, 8);
  };

  const handleRestrictedAction = () => {
    showRestrictionPopover();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      const clickedInsideHeaderRight =
        headerRightRef.current && headerRightRef.current.contains(target);
      const clickedInsidePopover =
        popoverRef.current && popoverRef.current.contains(target);

      if (!clickedInsideHeaderRight && !clickedInsidePopover) {
        setPopoverOpacity(0);
        setTimeout(() => setShowRestriction(false), 240);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleBookCardClick = (bookId) => {
    window.location.href = `/libro/${bookId}`;
  };

  return (
    <div className="logueado-container" style={{ backgroundImage: `url(${fondo})` }}>
      <Header
        user={user}
        onRestrictedAction={handleRestrictedAction}
        headerRightRef={headerRightRef}
      />

      {showRestriction && headerRightRef.current && (
        <div
          key={popoverKey}
          ref={popoverRef}
          className="restriction-popover-wrapper"
          style={{
            opacity: popoverOpacity,
            pointerEvents: popoverOpacity === 1 ? 'auto' : 'none',
            position: 'absolute',
            top: headerRightRef.current.getBoundingClientRect().bottom + window.scrollY + 8 + 'px',
            left: headerRightRef.current.getBoundingClientRect().right + window.scrollX - 260 + 'px',
            zIndex: 9999,
          }}
        >
          <RestrictionPopover />
        </div>
      )}

      <main className="logueado-main">
        <Carousel
          slides={mockCarouselData}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          onSlideClick={(slide) => handleBookCardClick(slide.id)}
        />

        {bookCarousels.map((carousel) => (
          <section className="book-section" key={carousel.id}>
            <h2 className="titulo-section">
              {carousel.title}
            </h2>

            <BookList libros={carousel.books} onBookClick={handleBookCardClick} />
          </section>
        ))}

      </main>

      <Footer />
    </div>
  );
}
