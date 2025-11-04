import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../pagescss/LibroDetalle.css";
import iconoFallback from "../assets/libroIcono.png"; // cambia ruta si está en otro lado

const API_BASE = "http://localhost:3000/nextread";

export default function LibroDetalle() {
  const { id } = useParams();
  const [libro, setLibro] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/libro/${id}`)
      .then((res) => res.json())
      .then(setLibro)
      .catch(console.error);
  }, [id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "http://localhost:5173/";
  };

  const handleFeatureClick = () => {
    alert("¡Pronto podrás acceder a las funcionalidades!!");
  };

  if (!libro) {
    return <p className="cargando">Cargando información del libro...</p>;
  }

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
        </div>
      </header>

      {/* Contenido principal */}
      <div className="libro-detalle-container">
        <div className="libro-card">
          <div className="libro-portada">
            {libro.portada ? (
              <img src={libro.portada} alt={libro.titulo} />
            ) : (
              <div className="portada-placeholder">Portada del libro</div>
            )}
          </div>

          <div className="libro-info">
            <h2 className="libro-titulo">{libro.titulo}</h2>
            <p className="libro-autor">{libro.autor}</p>

            <div className="libro-meta">
              <span>
                <strong>Género:</strong>{" "}
                {libro.generos?.join(", ") || "—"}
              </span>
              <span>
                <strong>Año:</strong> {libro.anio || "—"}
              </span>
              <span>
                <strong>{libro.tipo}</strong>
              </span>
            </div>

            <p className="libro-descripcion">{libro.descripcion}</p>

            <div className="libro-acciones">
              <button className="btn secundario" onClick={handleFeatureClick}>
                📖 En lectura
              </button>
              <button className="btn secundario" onClick={handleFeatureClick}>
                ❤️ Favorito
              </button>
              <button className="btn secundario" onClick={handleFeatureClick}>
                🕒 Para leer
              </button>
              <button className="btn secundario" onClick={handleFeatureClick}>
                ➕ Añadir a lista
              </button>
            </div>

            <div className="libro-footer">
              <div className="libro-rating">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={`estrella ${
                      i < (libro.ranking || 0) ? "activa" : ""
                    }`}
                  >
                    ★
                  </span>
                ))}
                <span className="rating-numero">
                  ({libro.ranking || 0})
                </span>
              </div>
              <button className="corazon" onClick={handleFeatureClick}>
                ❤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
