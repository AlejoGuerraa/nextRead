// src/components/userLists/UserFollowList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../header";
import Footer from "../footer";
import "../../pagescss/seguidores-seguidos.css";

const API_BASE = "http://localhost:3000/nextread";

export default function UserFollowList({ mode = "seguidos" }) {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!token || !currentUser.id) {
      navigate("/acceso");
      return;
    }

    fetchFollowList();
  }, [mode, token, currentUser.id, navigate]);

  // Filtrar la lista cuando cambia el search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredList(list);
    } else {
      const query = search.toLowerCase();
      const filtered = list.filter(item => {
        const usuario = item.usuario;
        const fullName = `${usuario.nombre} ${usuario.apellido} ${usuario.usuario}`.toLowerCase();
        return fullName.includes(query);
      });
      setFilteredList(filtered);
    }
  }, [search, list]);

  const fetchFollowList = async () => {
    try {
      setLoading(true);
      const pageTitle = mode === "seguidos" ? "Seguidos" : "Seguidores";
      setTitle(pageTitle);

      const endpoint =
        mode === "seguidos"
          ? `${API_BASE}/user/${currentUser.id}/seguidos`
          : `${API_BASE}/user/${currentUser.id}/seguidores`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const items = mode === "seguidos" ? res.data.seguidos : res.data.seguidores;
      setList(items || []);
      setFilteredList(items || []);
    } catch (err) {
      console.error(`Error cargando ${mode}:`, err);
      setList([]);
      setFilteredList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateProfile = (username) => {
    navigate(`/usuario/${username}`);
  };

  const getAvatarSrc = (usuario) => {
    if (!usuario) return "/iconos/LogoDefault1.jpg";
    const rawIcon = usuario.iconoData?.simbolo || usuario.idIcono;
    if (rawIcon) {
      if (typeof rawIcon === "string") {
        if (rawIcon.startsWith("/") || rawIcon.startsWith("http")) {
          return rawIcon;
        }
        return `/iconos/${rawIcon}`;
      }
    }
    return "/iconos/LogoDefault1.jpg";
  };

  return (
    <>
      <Header user={currentUser} />

      <main className="follow-page">
        <section className="follow-header">
          <h1>{title}</h1>
          <p className="follow-count">Total: {filteredList.length} de {list.length}</p>
        </section>

        {/* SEARCH INPUT */}
        <div className="follow-search-container">
          <input
            type="text"
            className="follow-search-input"
            placeholder={`Buscar en ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading">Cargando {title.toLowerCase()}...</div>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <p>No hay {title.toLowerCase()} aún</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron resultados</p>
          </div>
        ) : (
          <div className="follow-list">
            {filteredList.map((item) => {
              const usuario = item.usuario;
              const avatar = getAvatarSrc(usuario);

              return (
                <div
                  key={usuario.id}
                  className="follow-card"
                >
                  <div 
                    className="follow-card-content"
                    onClick={() => handleNavigateProfile(usuario.usuario)}
                    style={{ cursor: 'pointer', flex: 1 }}
                  >
                    <img
                      src={avatar}
                      alt={usuario.usuario}
                      className="follow-avatar"
                      onError={(e) => {
                        e.target.src = "/iconos/LogoDefault1.jpg";
                      }}
                    />

                    <div className="follow-info">
                      <h3>@{usuario.usuario}</h3>
                      <p className="follow-name">
                        {usuario.nombre} {usuario.apellido}
                      </p>
                      
                      {/* FAVORITOS DEL USUARIO */}
                      <div className="follow-favorites">
                        {usuario.autor_preferido && (
                          <div className="fav-item">
                            <span className="fav-icon">📚</span>
                            <span className="fav-text">{usuario.autor_preferido}</span>
                          </div>
                        )}
                        {usuario.genero_preferido && (
                          <div className="fav-item">
                            <span className="fav-icon">🎭</span>
                            <span className="fav-text">{usuario.genero_preferido}</span>
                          </div>
                        )}
                        {usuario.titulo_preferido && (
                          <div className="fav-item">
                            <span className="fav-icon">⭐</span>
                            <span className="fav-text">{usuario.titulo_preferido}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    className="follow-btn-view"
                    onClick={() => handleNavigateProfile(usuario.usuario)}
                  >
                    Ver perfil →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}