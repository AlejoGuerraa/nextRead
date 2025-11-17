// src/pages/Libro.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import InfoLibro from "../components/infoLibro";
import Resenas from "../components/reseñas";
import Header from "../components/header";
import Footer from "../components/footer";
import RestrictionPopover from "../components/popOver";

import "../pagescss/libro.css";

const API_BASE = "http://localhost:3000/nextread";

const safeParseGeneros = (generosData) => {
  if (Array.isArray(generosData)) return generosData;
  if (typeof generosData === "string") {
    try {
      const parsed = JSON.parse(generosData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function Libro() {
  const { id } = useParams();
  const [libro, setLibro] = useState(null);
  const [error, setError] = useState(null);

  // ==== POPOVER ====
  const actionRef = useRef(null);         // donde está el botón que dispara la restricción
  const popoverRef = useRef(null);        // referencia del popover
  const [showPopover, setShowPopover] = useState(false);
  const [popoverKey, setPopoverKey] = useState(0);
  const [popoverOpacity, setPopoverOpacity] = useState(0);

  const handleRestrictedAction = () => {
    setShowPopover(true);
  };

  const isLogged = Boolean(localStorage.getItem("user"));

  // cerrar popover al click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;

      const clickedInsideAction = actionRef.current && actionRef.current.contains(target);
      const clickedInsidePopover = popoverRef.current && popoverRef.current.contains(target);

      if (!clickedInsideAction && !clickedInsidePopover) {
        setPopoverOpacity(0);
        setTimeout(() => setShowPopover(false), 240);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ===== FETCH LIBRO =====
  useEffect(() => {
    axios.get(`${API_BASE}/libro/${id}`)
      .then((res) => {
        const data = { ...res.data, generos: safeParseGeneros(res.data.generos) };
        setLibro(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudo cargar la información del libro.");
        setLibro(null);
      });
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!libro) return <p className="cargando">Cargando información del libro...</p>;

  return (
    <div className="pagina-libro">
      <Header />

      <div
        className="libro-detalle-container"
        style={{ position: "relative" }}  // necesario para posicionamiento del popover
      >
        {/* Pasamos handleRestrictedAction y actionRef a InfoLibro */}
        <InfoLibro
          libro={libro}
          onRestrictedAction={handleRestrictedAction}
          actionRef={actionRef}
        />

        {/* ==== POPOVER POSICIONADO COMO EN PRINCIPAL PERO ARRIBA Y DERECHA ==== */}
        {!isLogged && showPopover && (
          <div
            ref={popoverRef}
            className="restriction-popover-wrapper"
            style={{
              opacity: 1,
              pointerEvents: "auto",
              position: "fixed",
              top: "80px",
              right: "40px",
              zIndex: 9999,
            }}
          >
            <RestrictionPopover />
          </div>
        )}

        <Resenas />
      </div>

      <Footer />
    </div>
  );
}
