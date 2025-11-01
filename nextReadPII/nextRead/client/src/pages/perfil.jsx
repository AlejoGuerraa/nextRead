import React from "react";
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

  const userString = localStorage.getItem("user");
  let user = null;
  if (userString) {
    try {
      user = JSON.parse(userString);
    } catch (e) {
      console.error("Error parseando JSON de usuario:", e);
    }
  }

  if (!user || !user.correo) {
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

  // small helper: how 'complete' are preferences (0-100)
  const prefCompletion = () => {
    const keys = ["autor_preferido", "genero_preferido", "titulo_preferido"];
    const defined = keys.reduce((acc, k) => acc + (user[k] && user[k].trim() ? 1 : 0), 0);
    return Math.round((defined / keys.length) * 100);
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/loguearse");
  };

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
            {rating ? "★".repeat(Math.round(rating)).slice(0,5) + "☆".repeat(Math.max(0, 5 - Math.round(rating))) : "—"}
          </span>
          <button className="btn-secondary small">Ver</button>
        </div>

        {/* ribbon for favorites */}
        {book?.favorite && <div className="ribbon">Top</div>}
      </div>
    );
  };

  // render placeholder if empty
  const renderRow = (items) => {
    if (!items || !items.length) return (
      <div className="empty-list">Puedes agregar libros desde la página principal</div>
    );
    return items.map((b, i) => renderBookCard(b, i));
  };

  // For listas personalizadas, we show IDs for now
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

  // compute general rating from available book objects (seguirLeyendo + favoritos) or use user.rating_general
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

  // ----- LOGROS (ACHIEVEMENTS) UI -----
  // NOTE: por pedido tuyo, aquí dejo la UI lista pero sin llamadas al backend.
  // Cuando tengas la API de tu compañero, reemplazamos la fuente de datos por la llamada fetch/axios correspondiente.
  // Mientras tanto intentamos leer de user.logros (objetos) o user.logros_ids (array de ids) si están en localStorage.

  const userAchievements = Array.isArray(user.logros)
    ? user.logros
    : Array.isArray(user.logros_ids)
      ? user.logros_ids
      : [];

  const renderAchievementCard = (ach, index) => {
    // ach puede ser un objeto { id, title, desc, icon } o solo un id (number/string)
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
          <button className="btn-secondary small" onClick={() => {/* placeholder, no-op */}}>Ver</button>
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
      {/* Header (keep functionality) */}
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
          {/* Removed "Explorar" button as requested */}
          <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </header>

      {/* Banner */}
      <section
        className="profile-banner fancy-banner"
        style={{
          backgroundColor: user.banner || COLORS.tempBanner,
          // gradient overlay to make text readable
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.25))`
        }}
      >
        <div className="banner-inner">
          <div className="avatar-wrapper">
            {avatarContent}
            <div className="avatar-ring" />
          </div>

          <div className="banner-text">
            <h2 className="banner-username">@{user.usuario || "sin_usuario"}</h2>
            <h1 className="banner-name">{(user.nombre || "Nombre") + " " + (user.apellido || "Apellido")}</h1>
            <p className="banner-bio">{user.descripcion ? user.descripcion : "Bienvenido a tu perfil."}</p>
          </div>

          <div className="banner-actions">
            {/* Removed pref-pill / preferencias display per request */}
            <div className="edit-sep" aria-hidden="true">--</div>
            <button className="btn-primary small" onClick={() => navigate("/perfil/editar")}>Editar perfil</button>
          </div>
        </div>

        {/* subtle SVG wave bottom */}
        <svg className="banner-wave" viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path d="M0,30 C200,80 400,0 720,30 C1040,60 1240,10 1440,30 L1440 60 L0 60 Z" fill="rgba(255,255,255,0.06)"/>
        </svg>
      </section>

      {/* Main content */}
      <main className="profile-main enhanced-main">
        <section className="profile-summary">
          <div className="profile-left card-glass">
            <h3>Acerca de mí</h3>
            <p className="descripcion-text">{user.descripcion || "Este usuario no ha escrito una descripción todavía."}</p>

            {/* preferences block removed as requested (was prefs-block) */}

            <div className="small-stats">
              <div className="small-stat">
                <span className="small-number">{favoritos.length}</span>
                <span className="small-label">Favoritos</span>
              </div>
              <div className="small-stat">
                <span className="small-number">{seguirLeyendo.length}</span>
                <span className="small-label">En lectura</span>
              </div>
              <div className="small-stat">
                <span className="small-number">{Object.keys(userLists).length}</span>
                <span className="small-label">Listas</span>
              </div>
            </div>
          </div>

          <aside className="profile-right card-glass">
            <h4>Actividad último mes</h4>
            <ul className="activity-list">
              <li>Has leído <strong>{stats.libros_leidos}</strong> libros</li>
              <li>Género más leído: <strong>{stats.genero_preferido === "No definido" ? "—" : stats.genero_preferido}</strong></li>
              <li>Rating general: <strong>{ratingGeneral ? `${ratingGeneral} / 5` : "—"}</strong></li>
            </ul>
            <div className="cta-row">
              {/* "Ver estadísticas" removed as requested */}
              <button className="btn-outline" onClick={() => navigate("/listas/crear")}>Crear lista</button>
            </div>
          </aside>
        </section>

        {/* Stats row - big cards */}
        <section className="profile-stats enhanced-stats">
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-number">{stats.libros_leidos}</div>
          
            </div>
            <div className="stat-label">Libros Leídos</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-number small">{stats.autor_preferido}</div>

            </div>
            <div className="stat-label">Autor Preferido</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-number small">{stats.genero_preferido}</div>
      
            </div>
            <div className="stat-label">Género Preferido</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-number small">{stats.titulo_preferido}</div>

            </div>
            <div className="stat-label">Título Preferido</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-number">{stats.amigos}</div>

            </div>
            <div className="stat-label">Amigos</div>
          </div>
        </section>

        {/* Lists: En lectura, Favoritos */}
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

        {/* Listas personalizadas dinámicas */}
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

        {/* ----- NUEVA SECCIÓN: LOGROS (ACHIEVEMENTS) ----- */}
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

        {/* Listas personalizadas dinámicas (si siguen abajo) */}
      </main>
    </div>
  );
};

export default Perfil;
