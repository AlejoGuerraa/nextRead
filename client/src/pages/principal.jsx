import React, { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";

import Header from "../components/header";
import Carousel from "../components/carrouselImagenes";
import BookList from "../components/carrouselLibros";
import Footer from "../components/footer";
import RestrictionPopover from "../components/popOver";

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
  const [librosTendencias, setLibrosTendencias] = useState([]);
  const [librosAutor, setLibrosAutor] = useState([]);
  const [autorMasLeidoNombre, setAutorMasLeidoNombre] = useState(null);
  const [librosGenero, setLibrosGenero] = useState([]);
  const [generoSeleccionado, setGeneroSeleccionado] = useState("Género...");
  const [librosRecomendados, setLibrosRecomendados] = useState([]);
  const [ultimoLibroObj, setUltimoLibroObj] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [librosPorDecada, setLibrosPorDecada] = useState([]);

  const headerRightRef = useRef(null);
  const popoverRef = useRef(null);
  const [showRestriction, setShowRestriction] = useState(false);
  const [popoverKey, setPopoverKey] = useState(0);
  const [popoverOpacity, setPopoverOpacity] = useState(0);

  const generosRotativos = [
    { genero: "Aventura", titulo: "Libros para aventurarse" },
    { genero: "Romance", titulo: "Libros para volver a enamorarse" },
    { genero: "Fantasía", titulo: "Historias mágicas para escapar" },
    { genero: "Terror", titulo: "Para no dormir nunca más" },
    { genero: "Ciencia Ficción", titulo: "Explora nuevos mundos" },
    { genero: "Misterio", titulo: "Intriga y suspenso" },
    { genero: "Histórico", titulo: "Viajes al pasado" },
    { genero: "Poesía", titulo: "Versos que inspiran" },
    { genero: "Clásicos", titulo: "Obras que perduran" },
    { genero: "No Ficción", titulo: "Conocimiento y realidad" },
    { genero: "Infantil", titulo: "Cuentos para los más pequeños" },
    { genero: "Épico", titulo: "Grandes sagas para grandes lectores" },
    { genero: "Filosófico", titulo: "Reflexiones profundas" },
    { genero: "Gótico", titulo: "Oscuridad y romance" },
  ];

  const generoActual = useMemo(() => {
    const random = Math.floor(Math.random() * generosRotativos.length);
    return generosRotativos[random];
  }, []);

  useEffect(() => {
    document.title = "NextRead - Inicio";
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  /* ---------------------------------------------------- */

  // 1. FETCH TENDENCIAS
  useEffect(() => {
    const fetchTendencias = async () => {
      try {
        const params = {};
        if (generoSeleccionado && generoSeleccionado !== "Género...")
          params.genero = generoSeleccionado;

        const res = await axios.get("http://localhost:3000/nextread/tendencias", { params });
        setLibrosTendencias(res.data || []);

      } catch (e) {
        console.error("Error cargando los libros de tendencias:", e);
        setLibrosTendencias([]);
      }
    };

    fetchTendencias();
  }, [generoSeleccionado]);

  // 2. FETCH DÉCADAS PERSONALIZADAS
  useEffect(() => {
    const fetchDecadasPersonalizadas = async () => {
      if (!user?.correo) {
        try {
          const res = await axios.get("http://localhost:3000/nextread/libros/por-decada");
          setLibrosPorDecada(Array.isArray(res.data?.decades) ? res.data.decades.slice(0, 5) : []);
        } catch (e) {
          console.error("Error cargando libros por década:", e);
          setLibrosPorDecada([]);
        }
        return;
      }

      try {
        const res = await axios.post("http://localhost:3000/nextread/decadas-personalizadas", {
          email: user.correo
        });
        setLibrosPorDecada(res.data?.decades || []);
      } catch (e) {
        console.error("Error cargando décadas personalizadas:", e);
        setLibrosPorDecada([]);
      }
    };

    if (user !== null) fetchDecadasPersonalizadas();
  }, [user]);

  // 3. FETCH AUTOR MÁS LEÍDO
  useEffect(() => {
    const fetchLibrosAutor = async () => {
      if (!user?.correo) {
        setLibrosAutor([]);
        setAutorMasLeidoNombre("Inicia sesión para ver recomendaciones");
        return;
      }

      setAutorMasLeidoNombre("Cargando recomendaciones...");

      try {
        const res = await axios.post(
          "http://localhost:3000/nextread/autorMasLeido",
          { email: user.correo }
        );

        if (res.data?.libros) {
          setLibrosAutor(res.data.libros);

          const nombre = res.data.message.match(/Libros de tu autor más leído: (.+)/);
          setAutorMasLeidoNombre(nombre ? nombre[1] : "Más Libros del Autor");
        } else {
          setLibrosAutor([]);
          setAutorMasLeidoNombre(res.data.message);
        }

      } catch (e) {
        console.error("Error cargando libros del autor más leído:", e);
        setLibrosAutor([]);
        setAutorMasLeidoNombre("Error al cargar las recomendaciones");
      }
    };

    if (user !== null) fetchLibrosAutor();
  }, [user]);

  /* ----------------------------------------------------
    4. FETCH GÉNEROS
    Carga la lista de géneros desde el backend
 -----------------------------------------------------*/
  useEffect(() => {
    const fetchLibrosPorGenero = async () => {
      try {
        // await la promesa
        const res = await axios.get(
          `http://localhost:3000/nextread/libros/genero`,
          { params: { genero: generoActual.genero } }
        );
        console.log(res)

        // según tu backend devolvés { genero, libros }
        setLibrosGenero(Array.isArray(res.data?.libros) ? res.data.libros : []);
      } catch (e) {
        console.error("Error cargando libros por género:", e);
        setLibrosGenero([]);
      }
    };

    // llamar la función
    fetchLibrosPorGenero();
  }, [generoActual]); // se ejecuta solo si generoActual cambia

  // 5. FETCH RECOMENDACIONES POR LIBRO
  useEffect(() => {
    const fetchRecomendaciones = async () => {
      try {
        if (!user?.id) {
          setLibrosRecomendados([]);
          return;
        }

        const leidos = user.libros_leidos;
        if (!Array.isArray(leidos) || leidos.length === 0) {
          setLibrosRecomendados([]);
          return;
        }

        const ultimoLibro = leidos[leidos.length - 1];
        setUltimoLibroObj(ultimoLibro); // ← LO GUARDAMOS

        const res = await axios.get(
          `http://localhost:3000/nextread/libros/recomendaciones/${user.id}/${ultimoLibro.id}`
        );

        setLibrosRecomendados(Array.isArray(res.data?.libros) ? res.data.libros : []);
      } catch (e) {
        console.error("Error cargando recomendaciones:", e);
        setLibrosRecomendados([]);
      }
    };

    fetchRecomendaciones();
  }, [user]);


  // POPUP + 🟣 handler

  const showRestrictionPopover = () => {
    setPopoverKey(k => k + 1);
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

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
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

      {/* POPUP */}
      {showRestriction && headerRightRef.current && (
        <div
          key={popoverKey}
          ref={popoverRef}
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


        {/* TENDENCIAS */}
        <section className="book-section">
          <h2 className="titulo-section">Novedades y Tendencias</h2>
          <BookList libros={librosTendencias} onBookClick={handleBookCardClick} />
        </section>

        {/* AUTOR MÁS LEÍDO */}
        <section className="book-section">
          <h2 className="titulo-section">
            {autorMasLeidoNombre || "Recomendaciones Personalizadas"}
          </h2>
          <BookList libros={librosAutor} onBookClick={handleBookCardClick} />
        </section>

        {/* CARRUSELES POR DÉCADA */}
        {librosPorDecada?.map((group) => (
          <section className="book-section" key={group.decade}>
            <h2 className="titulo-section">
              {`Libros de los ${group.decade.startsWith("19") ? group.decade.slice(2) : group.decade}`}
            </h2>

            <BookList libros={group.libros} onBookClick={handleBookCardClick} />
          </section>
        ))}

        {/* GÉNERO ROTATIVO */}
        <section className="book-section">
          <h2 className="titulo-section">{generoActual.titulo}</h2>
          <BookList libros={librosGenero} onBookClick={handleBookCardClick} />
        </section>

        {/* RECOMENDACIONES POR LIBRO */}
        {librosRecomendados.length > 0 && ultimoLibroObj && (
          <section className="book-section">
            <h2 className="titulo-section">Porque leíste {ultimoLibroObj.titulo}</h2>
            <BookList libros={librosRecomendados} onBookClick={handleBookCardClick} />
          </section>
        )}

      </main>

      <Footer />
    </div>
  );
}
