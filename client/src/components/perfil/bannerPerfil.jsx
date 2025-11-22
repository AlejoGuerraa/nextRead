// src/components/perfil/bannerPerfil.jsx
import React from "react";

export default function BannerPerfil({ user, onEdit, colors = {} }) {
    const tempBanner = colors.tempBanner || "#8e59f1ff";

    // ✔ Normalizar el icono (por si viene con comillas extras del JSON)
    const cleanIcon =
        typeof user.icono === "string"
            ? user.icono.replace(/^"|"$/g, "") // saca comillas si existen
            : user.icono;

    // ✔ Si el avatar viene en null / undefined / string vacía -> fallback
    const avatarSrc = cleanIcon && cleanIcon.trim() !== "" 
        ? cleanIcon 
        : "/iconos/default.png"; // asegurate de tener un default o cambialo

    return (
        <section
            className="profile-banner fancy-banner"
            style={{
                backgroundColor: user.banner || tempBanner,
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.25))`
            }}
        >
            <div className="banner-inner">
                <div className="avatar-wrapper">

                    <img
                        src={avatarSrc}
                        alt="Avatar"
                        className="perfil-img"
                        onError={(e) => { e.target.src = "/iconos/default.png"; }}
                    />

                    <div className="avatar-ring" />
                </div>

                <div className="banner-actions">
                    <div className="edit-sep" aria-hidden="true">--</div>
                    <button className="btn-primary small" onClick={onEdit}>
                        Editar perfil
                    </button>
                </div>
            </div>

            <svg className="banner-wave" viewBox="0 0 1440 60" preserveAspectRatio="none">
                <path
                    d="M0,30 C200,80 400,0 720,30 C1040,60 1240,10 1440,30 L1440 60 L0 60 Z"
                    fill="rgba(255,255,255,0.06)"
                />
            </svg>
        </section>
    );
}
