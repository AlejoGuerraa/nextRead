import React, { useEffect, useState } from "react";
import { BookOpen, Star, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import BookList from "../components/carrouselLibros";
import ListaCard from "../components/listasUsuario/ListaCard";
import { searchUsersByUsername, getUserFollowers, followUser, unfollowUser } from "../services/usersService";
import { useToast } from "../components/ToastProvider";
import "../pagescss/userProfile.css";

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1507842217343-583bb7270b66";
const getAssetUrl = (value, fallback) => {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value.startsWith("/") || value.startsWith("http") ? value : `/${value}`;
};
export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const [user, setUser] = useState(null);
  const [lists, setLists] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
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
        <div className="public-section-heading"><div><p className="public-section-eyebrow">Actividad</p><h2>Libros leídos</h2></div></div>
        {readBooks.length === 0 ? <div className="public-empty-state">{user.usuario} todavía no tiene libros registrados.</div> : <BookList libros={readBooks} onBookClick={(bookId) => navigate(`/libro/${bookId}`)} />}
      </section>

      <section className="public-profile-section">
        <div className="public-section-heading"><div><h2>Listas</h2></div></div>
        {lists.length === 0
          ? <div className="public-empty-state">Este usuario todavía no tiene listas públicas.</div>
          : <div className="public-profile-lists-grid">{lists.map((list) => <ListaCard key={list.id || list.nombre} name={list.nombre} books={Array.isArray(list.libros) ? list.libros : []} readOnly />)}</div>}
      </section>

      {preferences.length > 0 && <section className="public-profile-section"><div className="public-section-heading"><div><p className="public-section-eyebrow">Preferencias</p><h2>Lo que le gusta leer</h2></div></div><div className="public-preferences-grid">{preferences.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>}
    </main>

    <Footer />
  </div>;
}
