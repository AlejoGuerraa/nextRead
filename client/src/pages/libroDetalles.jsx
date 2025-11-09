import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../pagescss/LibroDetalle.css";
import iconoFallback from "../assets/libroIcono.png";

const API_BASE = "http://localhost:3000/nextread";

// Función de utilidad para parsear el campo generos de forma segura
// Esto es necesario porque Sequelize a veces lo devuelve como string JSON si se insertó con JSON.stringify
const safeParseGeneros = (generosData) => {
  if (Array.isArray(generosData)) {
    return generosData;
  }
  if (typeof generosData === 'string') {
    try {
      // Intenta parsear la cadena
      const parsed = JSON.parse(generosData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // En caso de fallo de parseo
      return [];
    }
  }
  return []; // Devuelve un array vacío si no es ni array ni string
};


export default function LibroDetalle() {
  const { id } = useParams();
  const [libro, setLibro] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/libro/${id}`)
      .then((response) => {
        // ⭐ Aplicar el safeParse a los generos inmediatamente después de la carga
        const rawLibro = response.data;
        const processedLibro = {
          ...rawLibro,
          generos: safeParseGeneros(rawLibro.generos)
        };
        setLibro(processedLibro);
        setError(null);
      })
      .catch((err) => {
        console.error("Error al cargar el libro:", err);
        setError("No se pudo cargar la información del libro. Verifique el backend.");
        setLibro(null);
      });
  }, [id]);

  const handleAddToList = async (tipo) => {
    const userData = JSON.parse(localStorage.getItem("user"));
    const token = userData?.token;
    const userId = userData?.id;

    if (!token || !userId) {
      alert("Tenés que iniciar sesión para agregar libros.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}/usuario/${tipo}/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(`✅ ${response.data.message}`);
    } catch (error) {
      console.error("Error al agregar libro:", error);
      alert(
        error.response?.data?.message ||
        "❌ Error al agregar el libro a la lista."
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "http://localhost:5173/";
  };

  const handleFeatureClick = () => {
    alert("¡Pronto podrás acceder a las funcionalidades!");
  };

  const handleStarClick = async (rating) => {
    setUserRating(rating);

    const userData = JSON.parse(localStorage.getItem("user"));
    const token = userData?.token;

    if (!token) {
      alert("Tenés que iniciar sesión para calificar un libro.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}/resena/${id}`,
        { puntuacion: rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message || `Le diste ${rating} estrellas a este libro ⭐`);
    } catch (error) {
      console.error("Error al guardar puntuación:", error);
      alert("❌ No se pudo guardar la puntuación.");
    }
    alert(`Le diste ${rating} estrellas a este libro ⭐`);
    // Lógica para enviar el rating al backend aquí (usando Axios si se requiere)
  };

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!libro) {
    return <p className="cargando">Cargando información del libro...</p>;
  }

  // Desestructuración para facilitar el acceso
  const {
    titulo,
    Autor,
    portada,
    generos, // Ahora 'generos' es garantizado un array
    anio,
    tipo,
    descripcion,
    ranking
  } = libro;

  const autorNombre = Autor?.nombre || 'Autor Desconocido';

  return (
    <div className="pagina-libro">
      {/* Header */}
      <header className="main-header enhanced-header">
        <div className="header-left">
          <img
            id="imagenLogo"
            src={iconoFallback}
            alt="Icono"
            className="logo-icon"
            onClick={() => {
              window.location.href = "http://localhost:5173/logueado";
            }}
            style={{ cursor: "pointer" }}
            role="button"
          />
          <div className="title-block">
            <span className="app-title">NextRead</span>
            <span className="app-subtitle">Tu espacio de lectura</span>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-logout" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="libro-detalle-container">
        <div className="libro-card">
          <div className="libro-portada">
            {portada ? (
              <img src={portada} alt={titulo} />
            ) : (
              <div className="portada-placeholder">Portada del libro</div>
            )}
          </div>

          <div className="libro-info">
            <h2 className="libro-titulo">{titulo}</h2>
            <p className="libro-autor">{autorNombre}</p>

            <div className="libro-meta">
              <span>
                {/* La llamada a .join() ahora es segura porque generos es un array */}
                <strong>Género:</strong> {generos.join(", ") || "—"}
              </span>
              <span>
                <strong>Año:</strong> {anio || "—"}
              </span>
              <span className="libro-tipo">
                <strong>{tipo || "—"}</strong>
              </span>
            </div>

            <p className="libro-descripcion">{descripcion || "Sin descripción disponible."}</p>

            <button className="btn secundario" onClick={() => handleAddToList("enLectura")}>
              🕮 En lectura
            </button>
            <button className="btn secundario" onClick={() => handleAddToList("favoritos")}>
              ♡ Favorito
            </button>
            <button className="btn secundario" onClick={() => handleAddToList("paraLeer")}>
              ⏱︎ Para leer
            </button>
            <button className="btn secundario" onClick={() => handleAddToList("lista")}>
              ➕ Añadir a lista
            </button>

            {/* RATING */}
            <div className="libro-footer">
              <div className="libro-rating">
                {Array.from({ length: 5 }, (_, i) => {
                  const ratingValue = i + 1;
                  return (
                    <span
                      key={ratingValue}
                      className={`estrella ${ratingValue <= (hoverRating || userRating)
                        ? "activa"
                        : ""
                        }`}
                      onClick={() => handleStarClick(ratingValue)}
                      onMouseEnter={() => setHoverRating(ratingValue)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      ★
                    </span>
                  );
                })}
                <span className="rating-numero">
                  ({userRating || ranking || 0})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de comentarios */}
        <div className="comentarios-section">
          <h3>Comentarios</h3>

          <div className="comentario">
            <div className="comentario-avatar">👤</div>
            <div className="comentario-contenido">
              <p className="comentario-usuario">UsuarioDemo</p>
              <p className="comentario-texto">
                Amee el libro, me encantó cada parte de la historia...
              </p>
              <div className="comentario-estrellas">★★★★☆</div>
            </div>
          </div>

          <div className="comentario">
            <div className="comentario-avatar">👤</div>
            <div className="comentario-contenido">
              <p className="comentario-usuario">BookLover92</p>
              <p className="comentario-texto">
                Lo volvería a leer mil veces, super recomendable.
              </p>
              <div className="comentario-estrellas">★★★★★</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
