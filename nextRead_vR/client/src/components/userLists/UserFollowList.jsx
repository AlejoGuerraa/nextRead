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

  const token = JSON.parse(localStorage.getItem("user"))?.token;

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

    if (mode === "seguidores") {
      endpoint = "http://localhost:3000/nextread/seguidores";
      pageTitle = "Seguidores";
    } else {
      endpoint = "http://localhost:3000/nextread/seguidos";
      pageTitle = "Seguidos";
    }

    setTitle(pageTitle);

    axios
      .get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setList(res.data || []);
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [mode]);

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

        // Actualiza inmediatamente la lista sin recargar
        setList((prev) => prev.filter((u) => u.id !== userId));

        updateProfileStats(-1); // resta uno
      } else {
        await axios.post(
          `http://localhost:3000/nextread/follow/${userId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

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

    if (mode === "seguidos") {
      user.stats.seguidos += diff;
    } else {
      user.stats.seguidores += diff;
    }

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
            {filteredList.length === 0 ? (
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
                    <span>{u.username ? `@${u.username}` : ""}</span>
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
            )}
          </div>
        )}
      </div>
    </>
  );
}