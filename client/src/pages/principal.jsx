import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePrincipal } from '../hooks/usePrincipal';

import Header from '../components/header';
import Carousel from '../components/carrouselImagenes';
import BookList from '../components/carrouselLibros';
import AuthorsCarousel from '../components/AuthorsCarousel';
import Footer from '../components/footer';

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
  const { bookCarousels, recommendationStatus } = usePrincipal(user);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    document.title = 'NextRead - Inicio';
  }, []);

  const handleBookCardClick = (bookId) => {
    window.location.href = `/libro/${bookId}`;
  };

  return (
    <div className="logueado-container" style={{ backgroundImage: `url(${fondo})` }}>
      <Header user={user} />

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

            {carousel.kind === 'authors' ? (
              <AuthorsCarousel autores={carousel.authors} />
            ) : (
              <BookList libros={carousel.books} onBookClick={handleBookCardClick} />
            )}
          </section>
        ))}

        {user?.id && recommendationStatus === 'pending' && (
          <section className="book-section">
            <h2 className="titulo-section">Recomendados para vos</h2>
            <p>Todavía no hay recomendaciones generadas.</p>
          </section>
        )}

        {user?.id && recommendationStatus === 'error' && (
          <section className="book-section">
            <h2 className="titulo-section">Recomendados para vos</h2>
            <p>No se pudieron cargar las recomendaciones.</p>
          </section>
        )}

      </main>

      <Footer />
    </div>
  );
}
