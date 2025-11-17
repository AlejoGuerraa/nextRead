import React, { useState, useEffect } from "react";
import Header from "../components/header"; 
import "../pagescss/seguidos.css";

export default function Seguidos() {
  const [busqueda, setBusqueda] = useState("");
  const [seguidos, setSeguidos] = useState([]);

  useEffect(() => {
    // cuando conectemos backend, se reemplaza por axios.get('/api/seguidos')
    setSeguidos([
      { id: 1, nombre: "Andrés Torres", username: "@andres_t" },
      { id: 2, nombre: "Micaela López", username: "@micalp" },
      { id: 3, nombre: "Pablo Díaz", username: "@pablod" },
    ]);
  }, []);

  const filtrados = seguidos.filter(
    (s) =>
      s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.username.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <Header /> {/* ✅ agregado sin tocar nada más */}
      <div className="following-container">
        <h1>🧑‍🤝‍🧑 Personas que seguís</h1>
        <input
          type="text"
          placeholder="Buscar seguidos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="search-bar"
        />

        <div className="following-list">
          {filtrados.length > 0 ? (
            filtrados.map((s) => (
              <div key={s.id} className="following-card">
                <div className="avatar-placeholder">
                  {s.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="following-info">
                  <h3>{s.nombre}</h3>
                  <p>{s.username}</p>
                </div>
                <button className="btn-unfollow">Dejar de seguir</button>
              </div>
            ))
          ) : (
            <p className="empty-msg">No estás siguiendo a nadie aún </p>
          )}
        </div>
      </div>
    </>
  );
}