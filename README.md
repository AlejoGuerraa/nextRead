NextRead - Guía Rápida de Componentización

⚠️ Regla principal: No crear páginas “monolíticas”. Todas las páginas se arman usando componentes.

Cómo armar páginas
Cada página importa componentes desde src/components/.

Evitar repetir lógica o estilos: reusar componentes existentes siempre que sea posible.
Ejemplo de página principal (principal.jsx):

import Header from "../components/header";
import Carousel from "../components/carrouselImagenes";
import BookList from "../components/carrouselLibros";
import Footer from "../components/footer";

export default function Principal() {
  return (
    <div>
      <Header />
      <Carousel slides={mockCarouselData} />
      <BookList libros={libros} onBookClick={handleBookClick} />
      <Footer />
    </div>
  );
}
