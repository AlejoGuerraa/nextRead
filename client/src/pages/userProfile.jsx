import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Eye, Star, Users, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import { searchUsersByUsername, getUserFollowers, followUser, unfollowUser } from "../services/usersService";
import { useToast } from "../components/ToastProvider";
import "../pagescss/userProfile.css";

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1507842217343-583bb7270b66";
const getAssetUrl = (value, fallback) => {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value.startsWith("/") || value.startsWith("http") ? value : `/${value}`;
};
const getBookId = (book) => book?.id || book?.id_libro || book?.book_id || null;
const getBookCover = (book) => book?.url_portada || book?.cover || book?.imagen || null;

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const readBooksRef = useRef(null);
  const [user, setUser] = useState(null);
  const [lists, setLists] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await searchUsersByUsername(username);
        const exactUser = data.results?.find((item) => item.usuario === username);
        if (!exactUser) throw new Error("Usuario no encontrado");
        const token = localStorage.getItem("token");
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        let following = false;
        if (token && currentUser.id) {
          const followersData = await getUserFollowers(exactUser.id);
          following = followersData.seguidores?.some((item) => Number(item.usuario?.id) === Number(currentUser.id)) || false;
        }
        if (!active) return;
        setUser(exactUser);
        setLists(Array.isArray(exactUser.listas) ? exactUser.listas : []);
        setIsFollowing(following);
        setError(null);
      } catch (fetchError) {
        if (active) setError(fetchError.message || "No se pudo cargar el perfil");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchUser();
    return () => { active = false; };
  }, [username]);

  const toggleFollow = async () => {
    if (!user) return;
    if (!localStorage.getItem("token")) {
      push("Debes iniciar sesión para seguir a usuarios", "error");
      return;
    }
    try {
      if (isFollowing) await unfollowUser(user.id);
      else await followUser(user.id);
      setIsFollowing((current) => !current);
      setUser((current) => ({ ...current, seguidores: Math.max(0, (current.seguidores || 0) + (isFollowing ? -1 : 1)) }));
    } catch (followError) {
      push(followError.response?.data?.error || "No se pudo actualizar el seguimiento", "error");
    }
  };

  const scrollBooks = (direction) => readBooksRef.current?.scrollBy({ left: direction * 420, behavior: "smooth" });
  if (loading) return <div className="public-profile-state">Cargando perfil...</div>;
  if (error) return <div className="public-profile-state public-profile-state--error">{error}</div>;
  if (!user) return <div className="public-profile-state">Usuario no encontrado.</div>;

  const avatar = getAssetUrl(user.iconoData?.simbolo, "/iconos/LogoDefault1.jpg");
  const banner = getAssetUrl(user.bannerData?.url, DEFAULT_BANNER);
  const readBooks = Array.isArray(user.libros_leidos) ? user.libros_leidos : [];
  const preferences = [["Autor preferido", user.autor_preferido], ["Género preferido", user.genero_preferido], ["Título preferido", user.titulo_preferido]].filter(([, value]) => typeof value === "string" && value.trim());

  return <div className="public-profile-page">
    <Header />
    <section className="public-profile-hero" style={{ backgroundImage: `url(${banner})` }}>
      <div className="public-profile-hero-shade" />
      <div className="public-profile-hero-inner">
        <img className="public-profile-avatar" src={avatar} alt={`Avatar de ${user.usuario}`} onError={(event) => { event.currentTarget.src = "/iconos/LogoDefault1.jpg"; }} />
        <div className="public-profile-identity"><h1>{user.nombre} {user.apellido}</h1><p className="public-profile-username">@{user.usuario}</p>{user.descripcion && <p className="public-profile-bio">{user.descripcion}</p>}</div>
        <button type="button" className={`public-follow-button${isFollowing ? " is-following" : ""}`} onClick={toggleFollow}><Users size={17} aria-hidden="true" />{isFollowing ? "Siguiendo" : "Seguir"}</button>
      </div>
    </section>

    <main className="public-profile-main">
      <section className="public-profile-stats" aria-label="Estadísticas del usuario">
        <div><BookOpen size={19} aria-hidden="true" /><strong>{user.librosLeidos || readBooks.length}</strong><span>Libros leídos</span></div>
        <div><Star size={19} aria-hidden="true" /><strong>{user.ratingPromedio ?? "—"}</strong><span>Rating promedio</span></div>
        <div><Users size={19} aria-hidden="true" /><strong>{user.seguidores || 0}</strong><span>Seguidores</span></div>
        <div><Users size={19} aria-hidden="true" /><strong>{user.siguiendo || 0}</strong><span>Siguiendo</span></div>
      </section>

      <section className="public-profile-section public-reading-section">
        <div className="public-section-heading"><div><p className="public-section-eyebrow">Actividad</p><h2>Libros leídos</h2></div><div className="public-carousel-actions"><button type="button" onClick={() => scrollBooks(-1)} aria-label="Ver libros anteriores"><ArrowLeft size={18} /></button><button type="button" onClick={() => scrollBooks(1)} aria-label="Ver más libros"><ArrowRight size={18} /></button></div></div>
        {readBooks.length === 0 ? <div className="public-empty-state">{user.usuario} todavía no tiene libros registrados.</div> : <div className="public-books-scroll" ref={readBooksRef}>{readBooks.map((book) => { const bookId = getBookId(book); return <button className="public-book-card" type="button" key={bookId} onClick={() => bookId && navigate(`/libro/${bookId}`)}><span className="public-book-cover">{getBookCover(book) ? <img src={getBookCover(book)} alt={book.titulo || "Libro"} /> : <span />}</span><strong>{book.titulo || "Libro sin título"}</strong>{book.puntuacion_usuario && <span className="public-book-rating"><Star size={13} fill="currentColor" /> {book.puntuacion_usuario}</span>}</button>; })}</div>}
      </section>

      {lists.length > 0 && <section className="public-profile-section"><div className="public-section-heading"><div><h2>Listas</h2></div></div><div className="public-lists-grid">{lists.map((list) => <button type="button" className="public-list-card" key={list.id} onClick={() => setSelectedList(list)}><div className="public-list-covers">{(list.portadas || []).slice(0, 3).map((cover, index) => <img key={`${list.id}-${index}`} src={cover} alt="" />)}</div><div><h3>{list.nombre}</h3><span>{list.totalLibros} {list.totalLibros === 1 ? "libro" : "libros"}</span></div><Eye size={17} aria-hidden="true" /></button>)}</div></section>}
      {lists.length === 0 && <section className="public-profile-section"><div className="public-empty-state">Este usuario todavía no tiene listas públicas.</div></section>}

      {preferences.length > 0 && <section className="public-profile-section"><div className="public-section-heading"><div><p className="public-section-eyebrow">Preferencias</p><h2>Lo que le gusta leer</h2></div></div><div className="public-preferences-grid">{preferences.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>}
    </main>

    {selectedList && <div className="list-detail-overlay" onClick={() => setSelectedList(null)}><section className="list-detail-modal public-list-detail-modal" role="dialog" aria-modal="true" aria-labelledby="public-list-detail-title" onClick={(event) => event.stopPropagation()}><header className="list-detail-header"><div><h2 id="public-list-detail-title" style={{ color: "white" }}>{selectedList.nombre}</h2><span>{selectedList.totalLibros} {selectedList.totalLibros === 1 ? "libro" : "libros"}</span></div><button className="list-icon-button" type="button" onClick={() => setSelectedList(null)} aria-label="Cerrar lista"><X size={20} aria-hidden="true" /></button></header>{(selectedList.libros || []).length === 0 ? <div className="list-detail-empty"><span className="list-empty-mark" aria-hidden="true" /><h3>Esta lista está vacía</h3></div> : <div className="list-detail-books">{selectedList.libros.map((book, index) => { const bookId = getBookId(book); return <article className="list-detail-book" key={bookId || index} onClick={() => bookId && navigate(`/libro/${bookId}`)}><div className="list-detail-cover">{getBookCover(book) ? <img src={getBookCover(book)} alt={book.titulo || "Libro"} /> : <span className="list-cover-placeholder" aria-hidden="true" />}</div><h3>{book.titulo || "Libro sin título"}</h3></article>; })}</div>}</section></div>}
    <Footer />
  </div>;
}
