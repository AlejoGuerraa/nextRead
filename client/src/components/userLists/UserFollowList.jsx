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
          const userObj = entry.usuario || entry;
          return {
            id: userObj.id,
            nombre: userObj.nombre,
            apellido: userObj.apellido,
            usuario: userObj.usuario,
            icono: userObj.icono || null,
            idIcono: userObj.idIcono ?? null,
            // teSigo = true if current user is following this listed user
            teSigo: mySeguidosIds.has(userObj.id)
          };
        });

        setList(normalized);
      })
        .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [mode]);

  // ------------------------
  // LIVE SEARCH (debounced)
  // ------------------------
  useEffect(() => {
    // don't perform search for tiny strings
    const q = (search || '').trim();
    if (q.length < 2) {
      // clear search results when user clears or types very small query
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get('http://localhost:3000/nextread/buscar-usuario', {
          params: { q },
          headers: { Authorization: `Bearer ${token}` }
        });

        if (cancelled) return;

        const results = (res.data && res.data.results) || [];

        // Compute teSigo using current user's seguidos
        // We will fetch the current user's seguidos once (reuse existing logic)
        const mineRes = await axios.get(`http://localhost:3000/nextread/user/${currentUserId}/seguidos`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { seguidos: [] } }));
        const mine = (mineRes.data && (mineRes.data.seguidos || [])) || [];
        const mySeguidosIds = new Set(mine.map((r) => r.usuario?.id).filter(Boolean));

        const normalized = results.map((u) => ({
          id: u.id,
          nombre: u.nombre,
          apellido: u.apellido,
          usuario: u.usuario,
          icono: (u.iconoData && u.iconoData.simbolo) || null,
          idIcono: u.idIcono ?? null,
          teSigo: mySeguidosIds.has(u.id)
        }));

        setSearchResults(normalized);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, token, currentUserId]);

  // ----------------------------------------
  // ACCIONES: SEGUIR / DEJAR DE SEGUIR
  // ----------------------------------------
  const toggleFollow = async (userId, currentlyFollowing) => {
    try {
      if (currentlyFollowing) {
        await axios.delete(
          `http://localhost:3000/nextread/unfollow/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Si estamos en la lista de seguidos, eliminar del listado; si es la lista de seguidores
        // solo actualizamos la bandera teSigo a false
        if (mode === 'seguidos') {
          setList((prev) => prev.filter((u) => u.id !== userId));
        } else {
          setList((prev) => prev.map((u) => (u.id === userId ? { ...u, teSigo: false } : u)));
        }

        // update searchResults as well if present
        setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, teSigo: false } : u)));

        updateProfileStats(-1); // resta uno
      } else {

        // Use the new API for follow request
        await axios.post(
          `http://localhost:3000/nextread/follow/request/${userId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Mark the user as followed locally (optimistic)
        setList((prev) => prev.map((u) => (u.id === userId ? { ...u, teSigo: true } : u)));
        setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, teSigo: true } : u)));

        updateProfileStats(+1); // suma uno
      }
    } catch (err) {
      console.error(err);
    }
  };

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

                  {/* BOTÓN SEGUIR / DEJAR DE SEGUIR */}
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

                  {/* BOTÓN SEGUIR / DEJAR DE SEGUIR */}
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
                </div>
              )))
            )}
          </div>
        )}
      </div>
    </>
  );
}
