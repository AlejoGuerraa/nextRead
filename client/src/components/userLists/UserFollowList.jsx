// src/components/userLists/UserFollowList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../header"; // ⬅ IMPORTANTE

import "../../pagescss/seguidores-seguidos.css";

export default function UserFollowList({ mode }) {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const token = storedUser?.token;
  const currentUserId = storedUser?.id;

  // ----------------------------------------
  // CARGA DE DATOS
  // ----------------------------------------
  useEffect(() => {
    if (!token) {
      navigate("/acceso");
      return;
    }

    let endpoint = "";
    let pageTitle = "";

    const profileUserId = currentUserId; // by now this view shows the logged-in user's lists

    if (mode === "seguidores") {
      endpoint = `http://localhost:3000/nextread/user/${profileUserId}/seguidores`;
      pageTitle = "Seguidores";
    } else if (mode === 'solicitudes') {
      // pending incoming follow requests for this user
      endpoint = `http://localhost:3000/nextread/user/${profileUserId}/seguidores?estado=enviado`;
      pageTitle = "Solicitudes";
    } else {
      endpoint = `http://localhost:3000/nextread/user/${profileUserId}/seguidos`;
      pageTitle = "Seguidos";
    }

    setTitle(pageTitle);

    // Also fetch the current user's seguidos (to compute if we "teSigo")
    const mySeguidosEndpoint = `http://localhost:3000/nextread/user/${currentUserId}/seguidos`;

    Promise.all([
      axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(mySeguidosEndpoint, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { seguidos: [] } }))
    ])
      .then(([listRes, mineRes]) => {
        // mineRes.data.seguidos -> array of { estado, usuario }
        const mine = (mineRes.data && (mineRes.data.seguidos || [])) || [];
        const mySeguidosIds = new Set(mine.map((r) => r.usuario?.id).filter(Boolean));

        // listRes may return { seguidores: [...] } or { seguidos: [...] }
        const payload = listRes.data || {};
        const items = payload.seguidores || payload.seguidos || [];

        // normalize to simple user objects
        const normalized = items.map((entry) => {
          // entry may be { id, estado, usuario } (for seguidores) or a plain user object
          const userObj = entry.usuario || entry;
          const requestId = entry.id || null; // relation id when showing requests
          return {
            id: userObj.id,
            nombre: userObj.nombre,
            apellido: userObj.apellido,
            usuario: userObj.usuario,
            icono: userObj.icono || null,
            idIcono: userObj.idIcono ?? null,
            // teSigo = true if current user is following this listed user
            teSigo: mySeguidosIds.has(userObj.id),
            requestId
          };
        });

        setList(normalized);
      })
        .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [mode]);

  // ------------------------
  // ACCIONES PARA SOLICITUDES
  // ------------------------
  const acceptRequest = async (requestId) => {
    if (!requestId) return;
    try {
      setActionLoading(true);
      await axios.patch(
        `http://localhost:3000/nextread/follow/${requestId}`,
        { accion: 'aceptar' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // remove request from lists
      setList(prev => prev.filter(u => u.requestId !== requestId));
      setSearchResults(prev => prev.filter(u => u.requestId !== requestId));

      // update perfil counts in localStorage (recipient gained 1 follower)
      try {
        const user = JSON.parse(localStorage.getItem('user')) || {};
        if (user?.stats) {
          user.stats.seguidores = (user.stats.seguidores || 0) + 1;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (_) {}

    } catch (err) {
      console.error('Error aceptando solicitud', err);
      alert(err.response?.data?.error || 'Error aceptando solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectRequest = async (requestId) => {
    if (!requestId) return;
    try {
      setActionLoading(true);
      await axios.patch(
        `http://localhost:3000/nextread/follow/${requestId}`,
        { accion: 'rechazar' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // remove request from lists
      setList(prev => prev.filter(u => u.requestId !== requestId));
      setSearchResults(prev => prev.filter(u => u.requestId !== requestId));

    } catch (err) {
      console.error('Error rechazando solicitud', err);
      alert(err.response?.data?.error || 'Error rechazando solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  // ------------------------
  // LIVE SEARCH (debounced)
  // ------------------------
  // ...existing code...

  // ----------------------------------------
  // ACCIONES: SEGUIR / DEJAR DE SEGUIR
  // ----------------------------------------
  // ...existing code...

  // ----------------------------------------
  // ACTUALIZAR CONTADOR DEL PERFIL
  // ----------------------------------------
  const updateProfileStats = (diff) => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user?.stats) return;

    // A follow/unfollow action siempre afecta el contador de 'seguidos' (a quién sigo)
    user.stats.seguidos += diff;

    localStorage.setItem("user", JSON.stringify(user));
  };

  // ----------------------------------------
  // FILTRO DE BÚSQUEDA
  // ----------------------------------------
  const filteredList = list.filter((user) =>
    user.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header />

      <div className="follow-page">
        <h2 className="follow-title">{title}</h2>

        <input
          type="text"
          className="follow-search"
          placeholder={`Buscar ${title.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <div className="loader-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="follow-list">
            {/* If there's an active search (>=2 chars) show searchResults */}
            {search.length >= 2 ? (
              searchLoading ? (
                <div className="loader-container"><div className="spinner"/></div>
              ) : searchResults.length === 0 ? (
                <p className="empty-msg">No se encontraron resultados.</p>
              ) : (
                searchResults.map((u) => (
                <div key={u.id} className="follow-card">
                  <img
                    src={u.icono || "/default.png"}
                    className="follow-avatar"
                  />

                  <div className="follow-user-info">
                    <strong>{u.nombre}</strong>
                    <span>{u.usuario ? `@${u.usuario}` : ""}</span>
                  </div>

                  {/* Acciones para solicitudes (si corresponde) */}
                  {mode === 'solicitudes' ? (
                    <div className="requests-actions">
                      <button className="btn-accept" disabled={actionLoading} onClick={() => acceptRequest(u.requestId)}>Aceptar</button>
                      <button className="btn-reject" disabled={actionLoading} onClick={() => rejectRequest(u.requestId)}>Rechazar</button>
                    </div>
                  ) : (
                    <button
                      className={
                        u.teSigo
                          ? "btn-unfollow"
                          : "btn-follow"
                      }
                      onClick={() => toggleFollow(u.id, u.teSigo)}
                    >
                      {u.teSigo ? "Dejar de seguir" : "Seguir"}
                    </button>
                  )}
                </div>
                ))
              )
            ) : (
              filteredList.length === 0 ? (
                <p className="empty-msg">No se encontraron resultados.</p>
              ) : (
                filteredList.map((u) => (
                <div key={u.id} className="follow-card">
                  <img
                    src={u.icono || "/default.png"}
                    className="follow-avatar"
                  />

                  <div className="follow-user-info">
                    <strong>{u.nombre}</strong>
                    <span>{u.usuario ? `@${u.usuario}` : ""}</span>
                  </div>

                  {/* Acciones para solicitudes (si corresponde) */}
                  {mode === 'solicitudes' ? (
                    <div className="requests-actions">
                      <button className="btn-accept" disabled={actionLoading} onClick={() => acceptRequest(u.requestId)}>Aceptar</button>
                      <button className="btn-reject" disabled={actionLoading} onClick={() => rejectRequest(u.requestId)}>Rechazar</button>
                    </div>
                  ) : (
                    <button
                      className={
                        u.teSigo
                          ? "btn-unfollow"
                          : "btn-follow"
                      }
                      onClick={() => toggleFollow(u.id, u.teSigo)}
                    >
                      {u.teSigo ? "Dejar de seguir" : "Seguir"}
                    </button>
                  )}
                </div>
              )))
            )}
          </div>
        )}
      </div>
    </>
  );
}
