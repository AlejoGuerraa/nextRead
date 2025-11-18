// src/components/perfil/estadisticas.jsx
import React from "react";

export default function Estadisticas({ user, ratingGeneral, onCreateList }) {
    const stats = {
        libros_leidos: user.libros_leidos ?? 0,
        autor_preferido: user.autor_preferido || "No definido",
        genero_preferido: user.genero_preferido || "No definido",
        titulo_preferido: user.titulo_preferido || "No definido",
        seguidos: user.seguidos ?? 0,
        seguidores: user.seguidores ?? 0,
    };

    return (
        <aside className="profile-right card-glass">
            <h4>Actividad último mes</h4>
            <ul className="activity-list">
                <li>Has leído <strong>{stats.libros_leidos}</strong> libros</li>
                <li>Género más leído: <strong>{stats.genero_preferido === "No definido" ? "—" : stats.genero_preferido}</strong></li>
                <li>Rating general: <strong>{ratingGeneral ? `${ratingGeneral} / 5` : "—"}</strong></li>
            </ul>
            <div className="cta-row">
                <button className="btn-outline" onClick={onCreateList}>Crear lista</button>
            </div>
        </aside>
    );
}
