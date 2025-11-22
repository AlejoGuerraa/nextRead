import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../pagescss/perfil.css";
import iconoFallback from "../assets/libroIcono.png";

const COLORS = {
  primary: "#1A374D",
  secondary: "#406882",
  accent: "#6998AB",
  tempBanner: "#8e59f1ff"
};

const Perfil = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;

    if (!token) {
      navigate("/logueado");
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
        navigate("/loguearse");
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/loguearse");
  };

  if (loading) {
    return <div className="center">Cargando datos del usuario...</div>;
  }

  if (!user) {
    return (
      <div className="guest-page center">
        <p>No hay datos de usuario válidos. Por favor, <a href="/loguearse">inicia sesión</a>.</p>
        <button className="btn-primary" onClick={() => navigate("/loguearse")}>Ir a Loguearse</button>
      </div>
    );
  }

  const seguirLeyendo = Array.isArray(user.libros_en_lectura) ? user.libros_en_lectura : [];
  const favoritos = Array.isArray(user.libros_favoritos) ? user.libros_favoritos : [];
  const userLists = user.listas || {};

  const stats = {
    libros_leidos: user.libros_leidos ?? 0,
    autor_preferido: user.autor_preferido && user.autor_preferido.trim() ? user.autor_preferido : "No definido",
    genero_preferido: user.genero_preferido && user.genero_preferido.trim() ? user.genero_preferido : "No definido",
    titulo_preferido: user.titulo_preferido && user.titulo_preferido.trim() ? user.titulo_preferido : "No definido",
    amigos: user.amigos ?? 0,
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

  const placeholderBook = { title: "Sin libro", author: "-", rating: 0 };

  const renderBookCard = (book, index) => {
    const title = book?.title || book?.titulo || "Título desconocido";
    const author = book?.author || book?.autor || "Autor desconocido";
    const rating = book?.rating ?? book?.puntuacion ?? null;
    const cover = book?.cover || book?.imagen || null;

    return (
      <div
        key={index}
        className="book-card"
        aria-label={`card-${index}`}
      >
        <div className="book-cover">
          {cover ? <img src={cover} alt={title} /> : <div className="book-cover-placeholder">📘</div>}
        </div>

        <div className="book-meta">
          <span className="book-title">{title}</span>
          <span className="book-author">{author}</span>
        </div>

        <div className="book-footer">
          <span className="book-rating">
            {rating ? "★".repeat(Math.round(rating)).slice(0, 5) + "☆".repeat(Math.max(0, 5 - Math.round(rating))) : "—"}
          </span>
          <button className="btn-secondary small">Ver</button>
        </div>

        {book?.favorite && <div className="ribbon">Top</div>}
      </div>
    );
  };

  const renderRow = (items) => {
    if (!items || !items.length) return (
      <div className="empty-list">Puedes agregar libros desde la página principal</div>
    );
    return items.map((b, i) => renderBookCard(b, i));
  };

  const renderListByIds = (ids) => {
    if (!ids || !ids.length) return (
      <div className="empty-list">No hay libros en esta lista</div>
    );
    return ids.map((id, i) => (
      <div className="book-card" key={i}>
        <div className="book-cover"><div className="book-cover-placeholder">📖</div></div>
        <div className="book-meta">
          <span className="book-title">Libro {id}</span>
          <span className="book-author">Autor desconocido</span>
        </div>
        <div className="book-footer">
          <span className="book-rating">★☆☆☆☆</span>
          <button className="btn-secondary small">Ver</button>
        </div>
      </div>
    ));
  };

  const computeGeneralRating = () => {
    if (typeof user.rating_general === "number") return Math.round(user.rating_general * 10) / 10;
    const sources = [...seguirLeyendo, ...favoritos];
    const ratings = sources
      .map(b => b?.rating ?? b?.puntuacion ?? b?.calificacion)
      .filter(r => typeof r === "number" && !isNaN(r));
    if (ratings.length) {
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      return Math.round(avg * 10) / 10;
    }
    return null;
  };

  const ratingGeneral = computeGeneralRating();

  const userAchievements = Array.isArray(user.logros)
    ? user.logros
    : Array.isArray(user.logros_ids)
      ? user.logros_ids
      : [];

  const renderAchievementCard = (ach, index) => {
    const isObj = ach && typeof ach === 'object' && !Array.isArray(ach);
    const id = isObj ? ach.id : ach;
    const title = isObj ? (ach.title || `Logro ${id}`) : `Logro ${id}`;
    const desc = isObj ? (ach.desc || "Descripción del logro") : "Descripción del logro";
    const icon = isObj ? ach.icon : null;

    return (
      <div className="achievement-card book-card" key={index} aria-label={`achievement-${id}`}>
        <div className="book-cover">
          {icon ? <img src={icon} alt={title} /> : <div className="book-cover-placeholder">🏆</div>}
        </div>
        <div className="book-meta">
          <span className="book-title">{title}</span>
          <span className="book-author">{desc}</span>
        </div>
        <div className="book-footer">
          <button className="btn-secondary small">Ver</button>
        </div>
      </div>
    );
  };

  const renderAchievementsRow = (items) => {
    if (!items || !items.length) return (
      <div className="empty-list">Aún no tienes logros</div>
    );
    return items.map((a, i) => renderAchievementCard(a, i));
  };

  return (
    <div className="profile-page">
      <header className="main-header enhanced-header">
        <div className="header-left">
          <img
            id="imagenLogo"
            src={iconoFallback}
            alt="Icono"
            className="logo-icon"
            onClick={() => { window.location.href = "http://localhost:5173/logueado"; }}
            style={{ cursor: "pointer" }}
            role="button"
          />
          <div className="title-block">
            <span className="app-title">NextRead</span>
            <span className="app-subtitle">Tu espacio de lectura</span>
          </div>
        </div>

        <div className="header-right">
          <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </header>

      <section
        className="profile-banner fancy-banner"
        style={{
          backgroundColor: user.banner || COLORS.tempBanner,
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.25))`
        }}
      >
        <div className="banner-inner">
          <div className="avatar-wrapper">
            {avatarContent}
            <div className="avatar-ring" />
          </div>

          <div className="banner-actions">
            <div className="edit-sep" aria-hidden="true">--</div>
            <button className="btn-primary small" onClick={() => navigate("/perfil/editar")}>Editar perfil</button>
          </div>
        </div>

        <svg className="banner-wave" viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path d="M0,30 C200,80 400,0 720,30 C1040,60 1240,10 1440,30 L1440 60 L0 60 Z" fill="rgba(255,255,255,0.06)" />
        </svg>
      </section>

      <main className="profile-main enhanced-main">
        <section className="profile-summary">
          <div className="profile-left card-glass">
            <h3>Acerca de mí</h3>
            <h2 className="banner-username">@{user.usuario || "sin_usuario"}</h2>
            <h1 className="banner-name">{(user.nombre || "Nombre") + " " + (user.apellido || "Apellido")}</h1>
            <p className="descripcion-text">{user.descripcion || "Este usuario no ha escrito una descripción todavía."}</p>
          </div>

          <aside className="profile-right card-glass">
            <h4>Actividad último mes</h4>
            <ul className="activity-list">
              <li>Has leído <strong>{stats.libros_leidos}</strong> libros</li>
              <li>Género más leído: <strong>{stats.genero_preferido === "No definido" ? "—" : stats.genero_preferido}</strong></li>
              <li>Rating general: <strong>{ratingGeneral ? `${ratingGeneral} / 5` : "—"}</strong></li>
            </ul>
            <div className="cta-row">
              <button className="btn-outline" onClick={() => navigate("/listas/crear")}>Crear lista</button>
            </div>
          </aside>
        </section>

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

          <div className="stat-card">
            <div className="stat-label">Amigos</div>
            <div className="stat-top">
              <div className="stat-number">{stats.amigos}</div>
            </div>
          </div>
        </section>

        <section className="lists-section">
          <div className="list-block">
            <div className="list-header">
              <h3>Seguir leyendo</h3>
              <span className="list-meta">{seguirLeyendo.length} libros</span>
            </div>
            <div className="books-row hide-scrollbar">
              {seguirLeyendo.length ? renderRow(seguirLeyendo) : <div className="empty-list">Puedes agregar libros desde la página principal</div>}
            </div>
          </div>

          <div className="list-block">
            <div className="list-header">
              <h3>Favoritos</h3>
              <span className="list-meta">{favoritos.length} libros</span>
            </div>
            <div className="books-row hide-scrollbar">
              {favoritos.length ? renderRow(favoritos) : <div className="empty-list">Aún no tienes favoritos</div>}
            </div>
          </div>
        </section>

        <section className="custom-lists">
          <h3 className="section-title">Listas personalizadas</h3>

          {Object.keys(userLists).length ? (
            Object.entries(userLists).map(([listName, bookIds], idx) => (
              <div className="custom-list" key={idx}>
                <div className="list-header">
                  <h4>{listName}</h4>
                  <span className="list-meta">{bookIds.length} libros</span>
                </div>
                <div className="books-row hide-scrollbar">
                  {renderListByIds(bookIds)}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-list">Puedes crear listas desde la página principal</div>
          )}
        </section>

        <section className="achievements-section">
          <h3 className="section-title">Logros</h3>
          <div className="list-block">
            <div className="list-header">
              <h4>Tus logros</h4>
              <span className="list-meta">{userAchievements.length} logros</span>
            </div>
            <div className="books-row hide-scrollbar">
              {renderAchievementsRow(userAchievements)}
            </div>
          </div>
          <p className="muted-small">Nota: la lista está en modo placeholder. Cuando tengas la ruta del backend la conectamos para traer los logros por usuario (usuario_logro).</p>
        </section>
      </main>
    </div>
  );
};

export default Perfil;
