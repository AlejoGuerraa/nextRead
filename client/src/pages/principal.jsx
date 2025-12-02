// src/pages/Principal.jsx  (reemplaza tu versión actual)
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
import carrousel5 from "../assets/carrousel/carrousel1984.jpg";
import carrousel6 from "../assets/carrousel/carrouselTomie.jpg";
import carrousel7 from "../assets/carrousel/carrouselDorian.jpg";

const mockCarouselData = [
  { id: 263, imgUrl: carrousel1 }, // El Principito
  { id: 17, imgUrl: carrousel2 },  // Orgullo y Prejuicio
  { id: 25, imgUrl: carrousel3 },  // La Metamorfosis
  { id: 264, imgUrl: carrousel4 },   // Addie larue
  { id: 69, imgUrl: carrousel5 },  // 1984
  { id: 262, imgUrl: carrousel6 }, // Tomie Deluxe Edition
  { id: 62, imgUrl: carrousel7 },  // El Retrato de Dorian Gray
];

export default function Principal() {
  const [user, setUser] = useState(null);
  const [librosTendencias, setLibrosTendencias] = useState([]);
  const [librosAutor, setLibrosAutor] = useState([]);
  const [autorMasLeidoNombre, setAutorMasLeidoNombre] = useState(null);

  // Género basado en gustos del usuario
  const [generoUsuario, setGeneroUsuario] = useState(null);
  const [librosGeneroUsuario, setLibrosGeneroUsuario] = useState([]);

  const [generoSeleccionado, setGeneroSeleccionado] = useState("Género...");
  const [librosRecomendados, setLibrosRecomendados] = useState([]);
  const [ultimoLibroObj, setUltimoLibroObj] = useState(null); // objeto completo del último libro leído (si está disponible)

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

  useEffect(() => {
    document.title = "NextRead - Inicio";
  }, []);

  // Cargar user desde localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setUser(null);
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);

      // Normalizar campos que podrían venir como JSON-string
      const fixField = (field) => {
        if (typeof parsed[field] === "string") {
          try {
            parsed[field] = JSON.parse(parsed[field]);
          } catch {
            // si no es JSON válido, lo dejamos como está
          }
        }
      };

      fixField("libros_leidos");
      fixField("generos");
      fixField("autoresFavoritos");
      fixField("preferencias");
      fixField("historial");

      setUser(parsed);
    } catch {
      setUser(null);
    }
  }, []);


  // 🔒 CONTROL GLOBAL DE CUENTA ACTIVA
  useEffect(() => {
    if (user === null) return; // todavía no cargó

    // Si no hay usuario logueado → nada
    if (!user) return;

    // Si el usuario está desactivado
    if (user.activo === 0) {
      // Mostrar popup bonito
      alert("Tu cuenta fue desactivada. Debes volver a iniciar sesión.");

      // Borrar token y user del localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirigir
      window.location.href = "/acceso";
    }
  }, [user]);


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

          const nombre = res.data.message?.match?.(/Libros de tu autor más leído: (.+)/);
          setAutorMasLeidoNombre(nombre ? nombre[1] : "Más Libros del Autor");
        } else {
          setLibrosAutor([]);
          setAutorMasLeidoNombre(res.data?.message || "No hay recomendaciones");
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
    4. FETCH GÉNERO PREFERIDO y sus libros (usa user?.id)
  -----------------------------------------------------*/
  useEffect(() => {
    const fetchGeneroUsuario = async () => {
      // No solicitar si no hay usuario
      if (!user?.id) {
        setGeneroUsuario(null);
        setLibrosGeneroUsuario([]);
        return;
      }

      try {
        const res = await axios.get(
          `http://localhost:3000/nextread/libros/genero-usuario/${user.id}`
        );

        const genero = res.data?.generoPreferido || null;
        setGeneroUsuario(genero);
        setLibrosGeneroUsuario(Array.isArray(res.data?.libros) ? res.data.libros : []);
      } catch (e) {
        console.error("Error obteniendo género preferido:", e);
        setGeneroUsuario(null);
        setLibrosGeneroUsuario([]);
      }
    };

    fetchGeneroUsuario();
  }, [user?.id]); // sólo cuando cambia el id

  // Calcula el título para el género del usuario (useMemo para evitar recalculos innecesarios)
  const tituloGenero = useMemo(() => {
    if (!generoUsuario) return null;
    const match = generosRotativos.find(g => {
      // comparar ignorando mayúsculas/minúsculas y acentos simples
      return g.genero.toLowerCase() === generoUsuario.toString().toLowerCase();
    });
    return match?.titulo || `Recomendados de ${generoUsuario}`;
  }, [generoUsuario]);

  // 5. FETCH RECOMENDACIONES POR EL ÚLTIMO LIBRO LEÍDO
  useEffect(() => {
    const fetchRecomendaciones = async () => {
      try {
        if (!user?.id) {
          setLibrosRecomendados([]);
          setUltimoLibroObj(null);
          return;
        }

        // Normalizar libros leídos desde user
        let leidos = user.libros_leidos || [];
        if (typeof leidos === "string") {
          try { leidos = JSON.parse(leidos); } catch { leidos = []; }
        }
        if (!Array.isArray(leidos)) leidos = [];

        if (leidos.length === 0) {
          setLibrosRecomendados([]);
          setUltimoLibroObj(null);
          return;
        }

        // Tomar el último elemento
        const ultimo = leidos[leidos.length - 1];

        // Caso A: si 'ultimo' es un objeto que contiene id/titulo -> úsalo directamente
        let ultimoId = null;
        if (typeof ultimo === "object" && ultimo !== null) {
          // intentamos obtener id ya sea como id o idLibro
          ultimoId = Number(ultimo.id ?? ultimo.idLibro ?? ultimo);
          // guardamos el objeto tal cual (podría tener titulo)
          setUltimoLibroObj(ultimo);
        } else {
          // Caso B: si es un número o string con id -> convertir a número
          ultimoId = Number(ultimo);
          setUltimoLibroObj(null); // aún no tenemos el objeto completo
        }

        if (!Number.isInteger(ultimoId)) {
          // no tenemos id válido: limpiar y salir
          setLibrosRecomendados([]);
          return;
        }

        // Si no tenemos el objeto completo, pedirlo para obtener el título (útil para el header)
        if (!ultimoLibroObj || (ultimoLibroObj && Number(ultimoLibroObj.id ?? ultimoLibroObj.idLibro ?? 0) !== ultimoId)) {
          try {
            const detalle = await axios.get(`http://localhost:3000/nextread/libro/${ultimoId}`);
            if (detalle?.data) {
              // detalle.data ya viene con generos parseados por tu endpoint getLibroById
              setUltimoLibroObj(detalle.data);
            }
          } catch (e) {
            // si falla el fetch del libro, no es crítico; seguimos sin titulo
            console.warn("No se pudo obtener detalle del último libro leído:", e);
          }
        }

        // Pedir recomendaciones usando el id del último libro
        const res = await axios.get(
          `http://localhost:3000/nextread/libros/recomendaciones/${user.id}/${ultimoId}`
        );

        setLibrosRecomendados(Array.isArray(res.data?.libros) ? res.data.libros : []);
      } catch (e) {
        console.error("Error cargando recomendaciones:", e);
        setLibrosRecomendados([]);
      }
    };

    fetchRecomendaciones();
  }, [user]); // se re-ejecuta cuando cambia `user` (por ejemplo al agregar un libro leido)

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
        <Carousel
          slides={mockCarouselData}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          onSlideClick={(slide) => handleBookCardClick(slide.id)}
        />

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

        {/* RECOMENDACIONES POR LIBRO */}
        {librosRecomendados.length > 0 && (
          <section className="book-section">
            <h2 className="titulo-section">
              {ultimoLibroObj?.titulo ? `Porque leíste ${ultimoLibroObj.titulo}` : "Recomendados para vos"}
            </h2>
            <BookList libros={librosRecomendados} onBookClick={handleBookCardClick} />
          </section>
        )}

        {/* CARRUSELES POR DÉCADA */}
        {librosPorDecada?.map((group) => (
          <section className="book-section" key={group.decade}>
            <h2 className="titulo-section">
              {`Libros de los ${group.decade.startsWith("19") ? group.decade.slice(2) : group.decade}`}
            </h2>

            <BookList libros={group.libros} onBookClick={handleBookCardClick} />
          </section>
        ))}

        {/* GÉNERO BASADO EN LOS GUSTOS DEL USUARIO */}
        {generoUsuario && (
          <section className="book-section">
            <h2 className="titulo-section">{tituloGenero}</h2>
            <BookList
              libros={librosGeneroUsuario}
              onBookClick={handleBookCardClick}
            />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
