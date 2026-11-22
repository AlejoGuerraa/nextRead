// src/pages/Libro.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from '../services/api';

import InfoLibro from "../components/infoLibro";
import RatingAfterReadModal from "../components/rating/RatingAfterReadModal";
import ElegirListaModal from "../components/listasUsuario/elegirListaModal";
import Resenas from "../components/rating/resenias";
import Header from "../components/header";
import Footer from "../components/footer";
import { open_guest_prompt } from "../components/popOver";

import "../pagescss/libro.css";
import "../pagescss/modals.css";

const API_BASE = "/nextread";

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
  const [bookRating, setBookRating] = useState(0);
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
  const [showRatingAfterRead, setShowRatingAfterRead] = useState(false);

  const handleRestrictedAction = () => {
    open_guest_prompt();
  };

  useEffect(() => {
    setBookRating(0);
  }, [id]);

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
        api.get(`${API_BASE}/user`)
          .then(res => setFullUser(res.data))
          .catch(err => console.error('Error fetching full user', err));
      }
    } catch (err) { }
  }, []);

  // ===== FETCH LIBRO =====
  useEffect(() => {
    api.get(`${API_BASE}/libro/${id}`)
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
      <Header user={user} />

      <div className="libro-detalle-container">
        <InfoLibro
          libro={libro}
          onRestrictedAction={handleRestrictedAction}
          onOpenChooseList={() => setShowChooseListModal(true)}
          onMarkedAsRead={() => setShowRatingAfterRead(true)}
          userRating={bookRating}
          onRatingChange={setBookRating}
          userBookLists={fullUser}
        />

        <Resenas rating={bookRating} onRatingChange={setBookRating} />
      </div>
      <ElegirListaModal isOpen={showChooseListModal} onClose={() => setShowChooseListModal(false)} listas={fullUser?.listas || {}} bookId={id} onAdded={(name, lista) => {
        // refrescar datos de usuario
        const token = localStorage.getItem('token');
        if (token) {
          api.get(`${API_BASE}/user`)
            .then(res => setFullUser(res.data))
            .catch(err => console.error('Error refrescando usuario', err));
        }
      }} />

      <RatingAfterReadModal
        isOpen={showRatingAfterRead}
        bookId={id}
        onClose={() => setShowRatingAfterRead(false)}
        onSaved={() => setShowRatingAfterRead(false)}
      />

      <Footer />
    </div>
  );
}
