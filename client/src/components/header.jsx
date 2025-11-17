// header.jsx
import { useNavigate } from "react-router-dom";
import SearchBar from "./busqueda"; 

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
          <SearchBar /> {/* Tu buscador funcional */}
        </div>
      </div>

      {/* DERECHA */}
      <div className="header-right" ref={headerRightRef}>
        <button
          className="icon-btn"
          title="Notificaciones"
          onClick={() => handleIconClick("notificaciones")}
        >
          🔔
        </button>

        <div
          className="profile-box"
          onClick={() => handleIconClick("perfil")}
          title={user ? "Ir al perfil" : "Necesitas una cuenta"}
        >
          <span className="avatar">👤</span>
          <span className="username">{user?.nombre || "Invitado"}</span>
        </div>
      </div>

      {/* ESTILOS INLINE */}
      <style>{`
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 36px;
          background: #1A374D; /* Azul marino exacto */
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
          font-size: 30px;
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
          color: #ffffff;
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

        .search-bar {
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          border: none;
          outline: none;
          font-size: 15px;
          background-color: #ffffff;
          color: #1A374D;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.08);
          transition: all 0.2s ease;
        }

        .search-bar:focus {
          box-shadow: 0 0 0 3px rgba(255,255,255,0.4);
          transform: scale(1.02);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .icon-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 22px;
          color: #ffffff;
          transition: transform 0.2s, opacity 0.2s;
        }

        .icon-btn:hover {
          transform: scale(1.2);
          opacity: 0.8;
        }

        .profile-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.15);
          padding: 6px 14px;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .profile-box:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        .avatar {
          font-size: 22px;
        }

        .username {
          font-weight: 500;
          font-family: "Poppins", sans-serif;
          color: #ffffff;
        }

        @media (max-width: 600px) {
          .search-wrapper {
            display: none;
          }
          .username {
            display: none;
          }
          .header-container {
            padding: 10px 18px;
          }
        }
      `}</style>
    </header>
  );
}
