// src/pages/UserProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/header";
import "../pagescss/userProfile.css";

export default function UserProfile() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [listas, setListas] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --------------------------------------
  // CARGAR USUARIO
  // --------------------------------------
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(
          `http://localhost:3000/nextread/buscar-usuario?q=${username}`
        );

        if (!res.ok) throw new Error("No se pudo obtener el usuario");

        const data = await res.json();

        if (!data.results || data.results.length === 0)
          throw new Error("Usuario no encontrado");

        const exactUser = data.results.find((u) => u.usuario === username);
        if (!exactUser) throw new Error("Usuario no encontrado");

        setUser(exactUser);
        setLoading(false);

        fetchListas(exactUser.id);
        fetchFollowState(exactUser.id);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchUser();
  }, [username]);

  // Actualizar listas cuando user se carga
  useEffect(() => {
    if (user) {
      let listasData = user.listas;
      if (typeof listasData === 'string') {
        try { listasData = JSON.parse(listasData); } catch { listasData = []; }
      }
      const listasArray = Array.isArray(listasData) ? listasData : [];
      console.log("Listas del usuario:", listasArray);
      setListas(listasArray);
    } else {
      setListas([]);
    }
  }, [user]);

  // --------------------------------------
  // CARGAR LISTAS DEL USUARIO
  // (Las listas están dentro del objeto usuario desde buscarUsuario)
  // --------------------------------------
  const fetchListas = async (idUser) => {
    // Esta función ya no se usa, las listas se cargan directamente del user
    // Se mantiene por compatibilidad
  };

  // --------------------------------------
  // Verificar si sigo al usuario (GET endpoint)
  const fetchFollowState = async (idUser) => {
    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || !currentUser.id) {
        setIsFollowing(false);
        return;
      }
      
      // Traer los seguidores de idUser y ver si currentUser está en la lista
      const res = await fetch(
        `http://localhost:3000/nextread/user/${idUser}/seguidores`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      
      // Si currentUser está en la lista de seguidores, significa que currentUser sigue a idUser
      const siguiendo = data.seguidores && data.seguidores.some(s => s.usuario.id === currentUser.id);
      setIsFollowing(siguiendo);
    } catch (err) {
      console.log("Error follow state:", err);
      setIsFollowing(false);
    }
  };

  // --------------------------------------
  // SEGUIR / DEJAR DE SEGUIR
  // --------------------------------------
  const toggleFollow = async () => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes iniciar sesión para seguir a usuarios');
      return;
    }

    const url = isFollowing
      ? `http://localhost:3000/nextread/dejar-seguir/${user.id}`
      : `http://localhost:3000/nextread/seguir/${user.id}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        // Actualizar UI inmediatamente
        const newFollowState = !isFollowing;
        setIsFollowing(newFollowState);
        
        // Actualizar contadores del perfil que se está viendo
        const diffFollowers = newFollowState ? 1 : -1;
        setUser(prev => ({
          ...prev,
          seguidores: (prev.seguidores || 0) + diffFollowers
        }));
        
        // Actualizar contador de "siguiendo" del usuario actual en localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser.id) {
          const diffFollowing = newFollowState ? 1 : -1;
          currentUser.siguiendo = (currentUser.siguiendo || 0) + diffFollowing;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Error al cambiar seguimiento');
      }
    } catch (err) {
      console.log("Error follow:", err);
      alert('Error al cambiar seguimiento');
    }
  };

  // --------------------------------------
  if (loading) return <p>Cargando perfil...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!user) return <p>Usuario no encontrado.</p>;

  return (
    <>
      <Header />

      <div className="userprofile-container">
        <div className="userprofile-card">

          {/* -------- BANNER -------- */}
          <img
            className="userprofile-banner"
            src={
              user?.bannerData?.url ||
              "https://images.unsplash.com/photo-1507842217343-583bb7270b66"
            }
            alt="banner"
          />

          {/* -------- AVATAR -------- */}
          <img
            className="userprofile-avatar"
            src={user?.iconoData?.simbolo || "https://i.imgur.com/6VBx3io.png"}
            alt="avatar"
          />

          {/* -------- NOMBRE Y BOTÓN -------- */}
          <h2 className="userprofile-username">@{user.usuario}</h2>

          <button
            onClick={toggleFollow}
            className={isFollowing ? "follow-btn unfollow" : "follow-btn"}
          >
            {isFollowing ? "Dejar de seguir" : "Seguir"}
          </button>

          {/* -------- BIO -------- */}
          <p className="userprofile-bio">
            {user.descripcion || "Este usuario aún no escribió su biografía."}
          </p>

          {/* -------- STATS -------- */}
          <div className="stats-row">
            <div className="stat-box">
              <strong>{user.seguidores ?? 0}</strong>
              <span>Seguidores</span>
            </div>

            <div className="stat-box">
              <strong>{user.siguiendo ?? 0}</strong>
              <span>Siguiendo</span>
            </div>

            <div className="stat-box">
              <strong>{listas.length}</strong>
              <span>Listas</span>
            </div>

            <div className="stat-box">
              <strong>{user.librosLeidos || 0}</strong>
              <span>Leídos</span>
            </div>
          </div>

          {/* -------- INFO DEL USUARIO -------- */}
          <div className="userprofile-section">
            <h3 className="userprofile-section-title">Información</h3>

            <p>
              <strong>Nombre:</strong> {user.nombre} {user.apellido}
            </p>

            {/* Mostrar favoritos en lugar de email para otros usuarios */}
            {user.usuario === (JSON.parse(localStorage.getItem('user') || '{}').usuario) ? (
              <p>
                <strong>Email:</strong> {user.correo}
              </p>
            ) : (
              <div className="userprofile-favorites">
                <p>
                  <strong>Autor favorito:</strong> {user.autor_preferido && user.autor_preferido.trim() ? user.autor_preferido : "No definido"}
                </p>
                <p>
                  <strong>Género favorito:</strong> {user.genero_preferido && user.genero_preferido.trim() ? user.genero_preferido : "No definido"}
                </p>
                <p>
                  <strong>Libro favorito:</strong> {user.titulo_preferido && user.titulo_preferido.trim() ? user.titulo_preferido : "No definido"}
                </p>
              </div>
            )}

            {user.pais && (
              <p>
                <strong>País:</strong> {user.pais}
              </p>
            )}

            {user.libro_favorito && (
              <p>
                <strong>Libro favorito:</strong> {user.libro_favorito}
              </p>
            )}

            {user.fecha_creacion && (
              <p>
                <strong>Miembro desde:</strong>{" "}
                {new Date(user.fecha_creacion).toLocaleDateString("es-AR")}
              </p>
            )}
          </div>

          {/* -------- LISTAS -------- */}
          <div className="userlists-wrapper">
            <div className="userlists-header">
              <h3>Listas creadas por {user.usuario}</h3>
            </div>

            <div className="userlists-grid">
              {listas.length === 0 && (
                <p style={{ opacity: 0.7 }}>Este usuario no tiene listas aún.</p>
              )}

              {listas.map((lista) => (
                <div key={lista.id} className="userlist-card">
                  <div className="card-top">
                    <h4 className="list-title">{lista.nombre}</h4>
                    <span className="list-count">{lista.totalLibros}</span>
                  </div>

                  <div className="covers-preview">
                    {lista.portadas?.length > 0 ? (
                      lista.portadas.slice(0, 3).map((p, i) => (
                        <div key={i} className="cover-mini">
                          <img src={p} alt="libro" />
                        </div>
                      ))
                    ) : (
                      <span className="no-covers">Sin portadas</span>
                    )}
                  </div>

                  <div className="list-footer">
                    <button className="btn-ver">Ver lista</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}