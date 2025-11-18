import React, { useState, useEffect } from "react";
import Header from "../components/header";
import "../pagescss/seguidores.css";

export default function Seguidores() {
  const [busqueda, setBusqueda] = useState("");
  const [seguidores, setSeguidores] = useState([]);

  useEffect(() => {
    // cuando conectemos backend, se reemplaza por axios.get('/api/seguidores')
    setSeguidores([
      { id: 1, nombre: "Sofía Ramírez", username: "@sofi_lectora" },
      { id: 2, nombre: "Carlos Gómez", username: "@carlitox" },
      { id: 3, nombre: "Lucía Méndez", username: "@lu_mdz" },
      { id: 4, nombre: "Martina Pérez", username: "@martupz" },
    ]);
  }, []);

  const filtrados = seguidores.filter(
    (s) =>
      s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.username.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <Header /> {/* ✅ agregado sin tocar nada más */}
      <div className="followers-container">
        <h1>👥 Tus Seguidores</h1>
        <input
          type="text"
          placeholder="Buscar seguidores..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="search-bar"
        />

        <div className="followers-list">
          {filtrados.length > 0 ? (
            filtrados.map((s) => (
              <div key={s.id} className="follower-card">
                <div className="avatar-placeholder">
                  {s.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="follower-info">
                  <h3>{s.nombre}</h3>
                  <p>{s.username}</p>
                </div>
                <button className="btn-follow">Seguir de vuelta</button>
              </div>
            ))
          ) : (
            <p className="empty-msg">No se encontraron seguidores </p>
          )}
        </div>
      </div>
    </>
  );
}