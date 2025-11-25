// src/pages/perfil.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "../pagescss/perfil.css";
import "../pagescss/modals.css";
import iconoFallback from "../assets/libroIcono.png";

import Header from "../components/header";
import BannerPerfil from "../components/perfil/bannerPerfil";
import SeccionAbout from "../components/perfil/seccionAbout";
import Estadisticas from "../components/perfil/estadisticas";
import ListaLogros from "../components/logros/listaLogros";
import BookList from "../components/carrouselLibros";
import Footer from "../components/footer";
import CreateListModal from "../components/CreateListModal";

const COLORS = {
  primary: "#1A374D",
  secondary: "#406882",
  accent: "#6998AB",
  tempBanner: "#8e59f1ff"
};

export default function Perfil() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;

    if (!token) {
      navigate("/");
      return;
    }

    axios
      .get("http://localhost:3000/nextread/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setUser(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error al obtener datos del usuario:", error);
        navigate("/acceso");
      });
  }, [navigate]);

  const refreshUser = () => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) return;
    axios.get("http://localhost:3000/nextread/user", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUser(res.data))
      .catch(err => console.error('Error refrescando usuario', err));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/acceso");
  };

  const handleBookCardClick = (bookId) => {
    window.location.href = `/libro/${bookId}`;
  };

  if (loading) {
    return <div className="center">Cargando datos del usuario...</div>;
  }

  if (!user) {
    return (
      <div className="guest-page center">
        <p>No hay datos de usuario válidos. Por favor, <a href="/acceso">inicia sesión</a>.</p>
        <button className="btn-primary" onClick={() => navigate("/acceso")}>Ir a Loguearse</button>
      </div>
    );
  }

  const librosLeidosCount = (() => {
    if (!user.libros_leidos) return 0;

    // Caso array real
    if (Array.isArray(user.libros_leidos)) {
      return user.libros_leidos.length;
    }

    // Caso JSON string
    try {
      const arr = JSON.parse(user.libros_leidos);
      return Array.isArray(arr) ? arr.length : 0;
    } catch {
      return 0;
    }
  })();


  const seguirLeyendo = Array.isArray(user.libros_en_lectura) ? user.libros_en_lectura : [];
  const favoritos = Array.isArray(user.libros_favoritos) ? user.libros_favoritos : [];
  const userLists = user.listas || {};

  const stats = {
    libros_leidos: librosLeidosCount ?? 0,
    autor_preferido: user.autor_preferido && user.autor_preferido.trim() ? user.autor_preferido : "No definido",
    genero_preferido: user.genero_preferido && user.genero_preferido.trim() ? user.genero_preferido : "No definido",
    titulo_preferido: user.titulo_preferido && user.titulo_preferido.trim() ? user.titulo_preferido : "No definido",
    seguidos: user.seguidos ?? 0,
    seguidores: user.seguidores ?? 0,
  };

  const avatarContent = (() => {
    if (user.icono && typeof user.icono === "string" && user.icono.startsWith("http")) {
      return <img src={user.icono} alt="avatar" className="avatar-img" />;
    }
    if (user.icono && user.icono.length <= 3) {
      return <div className="avatar-text">{user.icono}</div>;
    }
    return <img src={iconoFallback} alt="avatar fallback" className="avatar-img fallback" />;
  })();

  const renderBookCard = (book, index) => {
    const title = book?.title || book?.titulo || "Título desconocido";

    const id =
      book.id ||
      book.id_libro ||
      book.book_id ||
      book.idBook ||
      book.id_libros ||
      null;

    const author =
      book?.autorData?.nombre ||
      book?.nombre_autor ||
      "Autor desconocido";

    // ⭐ En Perfil quiero mostrar SOLO la puntuación del usuario
    const userRating =
      book?.puntuacion_usuario ??
      book?.puntuacion ??
      null;

    const cover =
      book?.cover ||
      book?.imagen ||
      book?.url_portada ||
      null;

    return (
      <div key={index} className="book-card" aria-label={`card-${index}`}>
        <div className="book-cover">
          {cover ? <img src={cover} alt={title} /> : <div className="book-cover-placeholder">📘</div>}
        </div>

        <div className="book-meta">
          <span className="book-title">{title}</span>
          <span className="book-author">{author}</span>
        </div>

        <div className="book-footer">

          {/* ⭐ Mostrar SOLO la puntuación del usuario */}
          <span className="book-rating">
            {userRating
              ? "★".repeat(Math.round(userRating)).slice(0, 5) +
              "☆".repeat(Math.max(0, 5 - Math.round(userRating)))
              : "—"}
          </span>

          <button className="btn-secondary small"
            onClick={() => handleBookCardClick(id)}>Ver</button>
        </div>

        {book?.favorite && <div className="ribbon">Top</div>}
      </div>
    );
  };



  const renderRow = (items) =>
    !items || !items.length ? (
      <div className="empty-list">Puedes agregar libros desde la página principal</div>
    ) : (
      items.map((b, i) => renderBookCard(b, i))
    );

  const computeGeneralRating = () => {
    if (!Array.isArray(user.libros_leidos) || user.libros_leidos.length === 0) {
      return null;
    }

    // Tomamos SOLO los libros leídos
    const ratings = user.libros_leidos
      .map((libro) =>
        libro?.puntuacion_usuario ??  // puntuación que el usuario le dio
        libro?.ranking ??             // ranking global del libro
        libro?.puntuacion ?? null
      )
      .filter((r) => typeof r === "number" && !isNaN(r));

    if (ratings.length === 0) return null;

    // Promedio
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return Math.round(avg * 10) / 10; // un decimal
  };


  const ratingGeneral = computeGeneralRating();

  const userAchievements = Array.isArray(user.logros)
    ? user.logros
    : Array.isArray(user.logros_ids)
      ? user.logros_ids
      : [];

  const normalizeBooks = (arr) =>
    arr.map((b) => ({
      ...b,
      id: b.id || b.id_libro || b.book_id || b.idBook || null
    }));

  return (
    <div className="profile-page">
      <Header user={user} />
      <BannerPerfil user={user} onEdit={() => navigate("/perfil/editar")} onLogout={handleLogout} colors={COLORS} avatarContent={avatarContent} />

      <main className="profile-main enhanced-main">
        <section className="profile-summary">
          <SeccionAbout user={user} />
          <Estadisticas user={user} ratingGeneral={ratingGeneral} />
        </section>
        <section className="user-lists-section">
          <div className="lists-header">
            <h3>Tus listas</h3>
            <div>
              <button className="btn" onClick={() => setShowCreateModal(true)}>Crear lista</button>
            </div>
          </div>

          {(!user.listas || Object.keys(user.listas).length === 0) ? (
            <div className="empty-list">No tienes listas creadas. Crea una para empezar.</div>
          ) : (
            Object.entries(user.listas).map(([name, books]) => (
              <div className="user-list-block" key={name}>
                <div className="list-header">
                  <h4>{name}</h4>
                  <span className="list-meta">{(books || []).length} libros</span>
                </div>
                <BookList libros={books || []} onBookClick={(id) => handleBookCardClick(id)} />
              </div>
            ))
          )}

        </section>
        {/* ESTADÍSTICAS CON BOTONES DE NAVEGACIÓN */}
        <section className="profile-stats enhanced-stats">
          <div className="stat-card">
            <div className="stat-label">Libros Leídos</div>
            <div className="stat-top">
              <div className="stat-number">{stats.libros_leidos}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Autor Preferido</div>
            <div className="stat-top">
              <div className="stat-number small">{stats.autor_preferido}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Género Preferido</div>
            <div className="stat-top">
              <div className="stat-number small">{stats.genero_preferido}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Título Preferido</div>
            <div className="stat-top">
              <div className="stat-number small">{stats.titulo_preferido}</div>
            </div>
          </div>

          {/* 👇 ESTOS DOS SON LOS NUEVOS BOTONES 👇 */}
          <div className="stat-card clickable" onClick={() => navigate("/seguidos")}>
            <div className="stat-label">Seguidos</div>
            <div className="stat-top">
              <div className="stat-number">{stats.seguidos}</div>
            </div>
          </div>

          <div className="stat-card clickable" onClick={() => navigate("/seguidores")}>
            <div className="stat-label">Seguidores</div>
            <div className="stat-top">
              <div className="stat-number">{stats.seguidores}</div>
            </div>
          </div>
        </section>

        <section className="lists-section">
          <div className="list-block">
            <div className="list-header">
              <h3>Seguir leyendo</h3>
              <span className="list-meta">{seguirLeyendo.length} libros</span>
            </div>

            <BookList
              libros={normalizeBooks(seguirLeyendo)}
              onBookClick={(id) => handleBookCardClick(id)}
            />

          </div>


          <div className="list-block">
            <div className="list-header">
              <h3>Favoritos</h3>
              <span className="list-meta">{favoritos.length} libros</span>
            </div>

            <BookList
              libros={normalizeBooks(favoritos)}
              onBookClick={(id) => handleBookCardClick(id)}
            />

          </div>

        </section>

        <section className="achievements-section">
          <h3 className="section-title">Logros</h3>
          <ListaLogros logros={userAchievements} />
        </section>
      </main>

      <Footer />
      <CreateListModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={() => { refreshUser(); }} />
    </div>
  );
}