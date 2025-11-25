import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

import Header from "../components/header";
import Carousel from "../components/carrouselImagenes";
import BookList from "../components/carrouselLibros";
import Footer from "../components/footer";
import RestrictionPopover from "../components/popOver";

// FIX: Se corrigió la ruta del CSS asumiendo que 'principal.css' está en la misma carpeta 'pages'
import "../pagescss/principal.css";

import fondo from "../assets/background/fondo.png";

import carrousel1 from "../assets/carrousel/carrouselPrincipito.jpg";
import carrousel2 from "../assets/carrousel/carrouselOrgulloYPrejuicio.jpg";
import carrousel3 from "../assets/carrousel/carrouselMetamorfosis.jpg";
import carrousel4 from "../assets/carrousel/carrouselElTunel.jpg";
import carrousel5 from "../assets/carrousel/carrousel5.jpeg"
import carrousel6 from "../assets/carrousel/carrousel6.jpg"

const mockCarouselData = [
  { id: 1, imgUrl: carrousel1 },
  { id: 2, imgUrl: carrousel2 },
  { id: 3, imgUrl: carrousel3 },
  { id: 4, imgUrl: carrousel4 },
  { id: 5, imgUrl: carrousel5 },
  { id: 6, imgUrl: carrousel6 },
];

export default function Principal() {
  const [user, setUser] = useState(null);
  const [librosTendencias, setLibrosTendencias] = useState([]); // Renombrado para claridad
  const [librosAutor, setLibrosAutor] = useState([]); // Nuevo estado para recomendaciones
  const [autorMasLeidoNombre, setAutorMasLeidoNombre] = useState(null); // Nuevo estado para el título
  const [generoSeleccionado, setGeneroSeleccionado] = useState("Género...");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Popover / restricción
  const headerRightRef = useRef(null);
  const popoverRef = useRef(null);
  const [showRestriction, setShowRestriction] = useState(false);
  const [popoverKey, setPopoverKey] = useState(0);
  const [popoverOpacity, setPopoverOpacity] = useState(0);

  // titulo pestaña
  useEffect(() => {
    document.title = "NextRead - Inicio";
  }, []);

  // Cargar user desde localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  // 1. FETCH TENDENCIAS
  useEffect(() => {
    const fetchTendencias = async () => {
      try {
        // Tu endpoint ya no usa params, pero lo mantengo por si acaso
        const params = {};
        if (generoSeleccionado && generoSeleccionado !== "Género...")
          params.genero = generoSeleccionado;
        
        // El endpoint de tendencias no necesita el email
        const res = await axios.get("http://localhost:3000/nextread/tendencias", {
          params,
        });
        setLibrosTendencias(res.data || []);
      } catch (e) {
        console.error("Error cargando los libros de tendencias:", e);
        setLibrosTendencias([]);
      }
    };
    fetchTendencias();
  }, [generoSeleccionado]);

  // 2. FETCH LIBROS DEL AUTOR MÁS LEÍDO (SE EJECUTA SOLO SI HAY USUARIO)
  useEffect(() => {
    const fetchLibrosAutor = async () => {
      // Si no hay usuario logueado o el objeto user no tiene correo, no consultamos
      if (!user || !user.correo) {
        setLibrosAutor([]);
        setAutorMasLeidoNombre("Inicia sesión para ver recomendaciones");
        return;
      }
      
      setAutorMasLeidoNombre("Cargando recomendaciones...");
      
      try {
        // Enviar el email en el cuerpo de la solicitud POST, ya que el controlador lo espera en req.body
        const res = await axios.post(
          "http://localhost:3000/nextread/autorMasLeido",
          { email: user.correo }
        );
        
        // Si el servidor devuelve un mensaje y libros, los procesamos
        if (res.data && res.data.libros) {
          setLibrosAutor(res.data.libros);
          // Usamos el nombre del autor del mensaje si está disponible
          const nombre = res.data.message.match(/Libros de tu autor más leído: (.+)/);
          setAutorMasLeidoNombre(nombre ? nombre[1] : "Más Libros del Autor");
        } else {
          // Si el servidor devuelve un mensaje de que no hay libros/autor
          setLibrosAutor([]);
          setAutorMasLeidoNombre(res.data.message || "No se encontraron más libros de tu autor preferido");
        }
        
      } catch (e) {
        console.error("Error cargando libros del autor más leído:", e);
        setLibrosAutor([]);
        setAutorMasLeidoNombre("Error al cargar las recomendaciones");
      }
    };

    // Solo llamamos a la función si el estado 'user' ha cambiado y es válido.
    if (user !== null) {
      fetchLibrosAutor();
    }
    
  }, [user]); // Dependencia clave: user

  // ... (Resto de las funciones para el Popover)

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
      const clickedInsideHeaderRight =
        headerRightRef.current && headerRightRef.current.contains(target);
      const clickedInsidePopover =
        popoverRef.current && popoverRef.current.contains(target);

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
    <div className="logueado-container" style={{ backgroundImage: `url(${fondo})` }}>
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
          ref={popoverRef}
          className="restriction-popover-wrapper"
          style={{
            opacity: popoverOpacity,
            pointerEvents: popoverOpacity === 1 ? "auto" : "none",
            position: "absolute",
            top:
              headerRightRef.current.getBoundingClientRect().bottom +
              window.scrollY +
              8 +
              "px",
            left:
              headerRightRef.current.getBoundingClientRect().right +
              window.scrollX -
              260 +
              "px",
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
        />

        {/* PRIMERA SECCIÓN: NOVEDADES Y TENDENCIAS (usa librosTendencias) */}
        <section className="book-section">
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
          <BookList libros={librosTendencias} onBookClick={handleBookCardClick} />
        </section>
        
        {/* SEGUNDA SECCIÓN: MÁS DE "AUTOR MÁS LEÍDO" (usa librosAutor) */}
        <section className="book-section">
          <h2
            style={{
              fontSize: "1.8rem",
              fontWeight: "600",
              marginBottom: "15px",
              marginLeft: "20px",
              color: "#222",
            }}
          >
            {/* Título dinámico */}
            {autorMasLeidoNombre || "Recomendaciones Personalizadas"}
          </h2>
          {/* Usamos el nuevo estado librosAutor */}
          <BookList libros={librosAutor} onBookClick={handleBookCardClick} />
        </section>

        {/* Sección 3, 4, etc. que siguen usando los libros de tendencia por defecto, 
            pero podrías reemplazarlos con más lógica de recomendación */}
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
        <BookList libros={librosTendencias} onBookClick={handleBookCardClick} />
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
        <BookList libros={librosTendencias} onBookClick={handleBookCardClick} />
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
        <BookList libros={librosTendencias} onBookClick={handleBookCardClick} />
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
        <BookList libros={librosTendencias} onBookClick={handleBookCardClick} />
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
        <BookList libros={librosTendencias} onBookClick={handleBookCardClick} />
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
        <BookList libros={librosTendencias} onBookClick={handleBookCardClick} />
        
      </main>

      <Footer />
    </div>
  );
}