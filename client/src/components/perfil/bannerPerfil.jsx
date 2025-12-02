// src/components/perfil/bannerPerfil.jsx
import React from "react";

export default function BannerPerfil({ user, onEdit, onLogout, colors = {} }) {
    const tempBanner = colors.tempBanner || "#8e59f1ff";

    // Obtener la URL del banner desde bannerData
    const bannerUrl = user?.bannerData?.url || null;

    // Normalizar el icono (puede venir como '/iconos/..' o solo 'LogoDefault1.jpg')
    const rawIcon = user?.iconoData?.simbolo || user?.icono || null;

    let avatarSrc = "/iconos/LogoDefault1.jpg";
    if (rawIcon) {
        if (typeof rawIcon === 'string') {
            if (rawIcon.startsWith('/') || rawIcon.startsWith('http')) {
                avatarSrc = rawIcon;
            } else {
                avatarSrc = `/iconos/${rawIcon}`;
            }
        }
    }

    const bannerStyle = bannerUrl
        ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { backgroundColor: tempBanner };

    return (
        <section
            className="profile-banner fancy-banner"
            style={{
                ...bannerStyle,
                position: 'relative'
            }}
        >
            <div className="banner-inner">
                <div className="avatar-wrapper">

                    <img
                        src={avatarSrc}
                        alt="Avatar"
                        className="perfil-img"
                        onError={(e) => { e.target.src = "/iconos/LogoDefault1.jpg"; }}
                    />

                    <div className="avatar-ring" />
                </div>

                <div className="banner-actions">
                    <button className="btn-logout-banner" onClick={onLogout}>
                        Desloguearse
                    </button>
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
