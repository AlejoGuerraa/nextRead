// src/components/perfil/seccionAbout.jsx
import React from "react";

export default function SeccionAbout({ user }) {
    return (
        <div className="profile-left card-glass">
            <h3>Acerca de mí</h3>
            <h2 className="banner-username">@{user.usuario || "sin_usuario"}</h2>
            <h1 className="banner-name">
                {(user.nombre || "Nombre") + " " + (user.apellido || "Apellido")}
            </h1>
            <p className="descripcion-text">
                {user.descripcion || "Este usuario no ha escrito una descripción todavía."}
            </p>
        </div>
    );
}
