// header.jsx
import { useNavigate } from "react-router-dom";
import SearchBar from "./busqueda";
import NotificacionesModal from "./notificaciones/NotificacionesModal";
import { useState } from "react";
import { Bell, User, Settings } from "lucide-react";

// IMPORTAMOS LA IMAGEN
import libroIcono from "../assets/libroIcono.png";

export default function Header({ user, onRestrictedAction, headerRightRef }) {
  const navigate = useNavigate();
  const [openNotif, setOpenNotif] = useState(false);

  const handleIconClick = (target) => {
    if (user) {
      if (target === "notificaciones") setOpenNotif(true);
      if (target === "perfil") navigate("/perfil");
    } else {
      onRestrictedAction?.();
    }
  };

  return (
    <>
      <header className="header-container">
        {/* IZQUIERDA */}
        <div className="header-left">
          <div className="logo" onClick={() => navigate("/")}>
            <div className="logo-circle">
              <img
                src={libroIcono}
                alt="Inicio"
                className="home-img"
              />
            </div>
          </div>

          <span className="app-title" onClick={() => navigate(-1)}>
            NextRead
          </span>

          <div className="search-wrapper">
            <SearchBar />
          </div>
        </div>

        {/* DERECHA */}
        <div className="header-right" ref={headerRightRef}>
          <button
            className="icon-btn"
            title="Configuración"
            onClick={() => navigate("/configuracion")}
          >
            <Settings size={24} className="settings-icon" />
          </button>

          <button
            className="icon-btn"
            title="Notificaciones"
            onClick={() => handleIconClick("notificaciones")}
          >
            <Bell size={24} className="bell-icon" />
          </button>

          <div
            className="profile-box"
            onClick={() => handleIconClick("perfil")}
            title={user ? "Ir al perfil" : "Necesitas una cuenta"}
          >
            <User size={22} className="user-icon" />
            <span className="username">{user?.nombre || "Invitado"}</span>
          </div>
        </div>

        {/* ESTILOS */}
        <style>{`
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 36px;
            background: linear-gradient(90deg, #1A374D, #406882);
            border-bottom: 3px solid #6998AB;
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.25);
            position: sticky;
            top: 0;
            z-index: 100;
            backdrop-filter: blur(8px);
          }

          /* --------- LOGO CIRCLE (MODIFICADO) --------- */
          .logo-circle {
            width: 52px;        /* más grande */
            height: 52px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px;
            box-shadow: 0 3px 8px rgba(0,0,0,0.25);
          }

          /* Sin hover, sin zoom */
          .logo-circle:hover {
            transform: none;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 20px;
          }

          .logo {
            cursor: pointer;
            padding: 0; /* ya no hace falta */
          }

          .home-img {
            width: 36px;  /* imagen más grande */
            height: 36px;
            object-fit: contain;
            transition: none; /* quitamos animación */
          }

          /* Se elimina totalmente el efecto hover */
          .logo:hover .home-img {
            transform: none;
          }

          .app-title {
            font-family: "Montserrat Alternates", sans-serif;
            font-weight: 600;
            font-size: 32px;       /* MÁS GRANDE */
            color: #dde6ecff;
            cursor: pointer;
            text-shadow: 0 2px 6px rgba(0,0,0,0.4);
            transition: opacity 0.25s ease;
          }


          .app-title:hover {
            opacity: 0.9;
          }

          .search-wrapper {
            margin-left: 24px;
            width: 320px;
          }

          .header-right {
            display: flex;
            align-items: center;
            gap: 20px;
          }

          .icon-btn {
            background: rgba(255,255,255,0.15);
            border: none;
            cursor: pointer;
            padding: 10px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            transition: all 0.3s ease;
            color: white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.18);
          }

          .icon-btn:hover {
            background: rgba(255,255,255,0.28);
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 6px 16px rgba(0,0,0,0.25);
          }

          .profile-box {
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(255, 255, 255, 0.15);
            padding: 10px 22px;
            border-radius: 32px;
            cursor: pointer;
            transition: all 0.3s ease;
            color: white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.15);
          }

          .profile-box:hover {
            background: rgba(255, 255, 255, 0.28);
            transform: translateY(-3px) scale(1.03);
            box-shadow: 0 6px 16px rgba(0,0,0,0.25);
          }

          .username {
            font-weight: 500;
            font-family: "Poppins", sans-serif;
            color: #fff;
          }

          @media (max-width: 600px) {
            .search-wrapper {
              display: none;
            }
            .username {
              display: none;
            }
            .header-container {
              padding: 12px 18px;
            }
          }
        `}</style>
      </header>

      <NotificacionesModal
        open={openNotif}
        close={() => setOpenNotif(false)}
      />
    </>
  );
}
