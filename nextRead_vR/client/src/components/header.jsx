import { useNavigate } from "react-router-dom";
import SearchBar from "./busqueda";

import notiImg from "../assets/iconos/NotiIcon.png"
import userImg from "../assets/iconos/perfilIcon.png"

export default function Header({ user, onRestrictedAction, headerRightRef }) {
  const navigate = useNavigate();

  const handleIconClick = (target) => {
    if (user) {
      if (target === "notificaciones") navigate("/notificaciones");
      else if (target === "perfil") navigate("/perfil");
    } else {
      onRestrictedAction?.();
    }
  };

  return (
    <header className="header-container">
      {/* IZQUIERDA */}
      <div className="header-left">
        <div className="logo" onClick={() => navigate("/")}>
          📚
        </div>
        <span className="app-title" onClick={() => navigate("/")}>
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
          title="Notificaciones"
          onClick={() => handleIconClick("notificaciones")}
        >
          <img src={notiImg} alt="Notificaciones" className = "icon-img"/>

        </button>

        <div
          className="profile-box"
          onClick={() => handleIconClick("perfil")}
          title={user ? "Ir al perfil" : "Necesitas una cuenta"}
        >
          <img src={userImg} alt="Perfil" className = "avatar-img"/>

          <span className="username">{user?.nombre || "Invitado"}</span>
        </div>
      </div>

      {/* ESTILOS INLINE */}
      <style>{`
        .icon-img {
          width: 47px;
          height: 47xpx;
          object-fit: contain;
          transform: translateY(-0.6px);
          display: block;
        }

        .avatar-img {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          font-size: 0;
        }

        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 36px;
          background: #1A374D;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo {
          cursor: pointer;
          transition: transform 0.25s;
        }

        .logo:hover {
          transform: scale(1.15);
        }

        .app-title {
          font-family: "Poppins", sans-serif;
          font-weight: 600;
          font-size: 22px;
          color: white;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .app-title:hover {
          opacity: 0.85;
        }

        .search-wrapper {
          margin-left: 20px;
          width: 300px;
        }

        .icon-btn img {
          pointer-events: none;
        }

        .icon-btn {
          background-color: transparent;
          border: none;
          cursor: pointer;
          padding: 2px;
          transition: all 0.25s ease;
          border-radius: 50%;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        .profile-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.15);
          padding: 3px 12px;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .profile-box:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        .username {
          font-weight: 500;
          font-family: "Poppins", sans-serif;
          color: white; 
        }
      `}</style>
    </header>
  );
}