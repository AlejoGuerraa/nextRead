// src/pages/Libro.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import InfoLibro from "../components/infoLibro";
import ElegirListaModal from "../components/listasUsuario/elegirListaModal";
import Resenas from "../components/resenias";
import Header from "../components/header";
import Footer from "../components/footer";
import RestrictionPopover from "../components/popOver";

import "../pagescss/libro.css";
import "../pagescss/modals.css";

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
  const initialUser = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();
  const [user, setUser] = useState(initialUser);
  const [fullUser, setFullUser] = useState(null);
  const [showChooseListModal, setShowChooseListModal] = useState(false);

  // ==== POPOVER ====
  const actionRef = useRef(null);         // donde está el botón que dispara la restricción
  const popoverRef = useRef(null);        // referencia del popover
  const [showPopover, setShowPopover] = useState(false);
  const [popoverKey, setPopoverKey] = useState(0);
  const [popoverOpacity, setPopoverOpacity] = useState(0);

  const handleRestrictedAction = () => {
    setShowPopover(true);
  };

  const isLogged = Boolean(initialUser);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
    // Si está logueado, obtener datos completos (listas)
    try {
      const token = localStorage.getItem('token');
      if (token) {
        axios.get(`${API_BASE}/user`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => setFullUser(res.data))
          .catch(err => console.error('Error fetching full user', err));
      }
    } catch (err) { }
  }, []);

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
      <Header user={user} onRestrictedAction={handleRestrictedAction} />

      <div
        className="libro-detalle-container"
        style={{ position: "relative" }}  // necesario para posicionamiento del popover
      >
        {/* Pasamos handleRestrictedAction y actionRef a InfoLibro */}
        <InfoLibro
          libro={libro}
          onRestrictedAction={handleRestrictedAction}
          actionRef={actionRef}
          onOpenChooseList={() => setShowChooseListModal(true)}
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
      <ElegirListaModal isOpen={showChooseListModal} onClose={() => setShowChooseListModal(false)} listas={fullUser?.listas || {}} bookId={id} onAdded={(name, lista) => {
        // refrescar datos de usuario
        const token = localStorage.getItem('token');
        if (token) {
          axios.get(`${API_BASE}/user`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setFullUser(res.data))
            .catch(err => console.error('Error refrescando usuario', err));
        }
      }} />

      <Footer />
    </div>
  );
}
