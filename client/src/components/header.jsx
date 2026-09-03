// header.jsx
import { useNavigate } from "react-router-dom";
import SearchBar from "./busqueda";
import NotificacionesModal from "./notificaciones/NotificacionesModal";
import { useState, useEffect } from "react";
import { Bell, User, Settings } from "lucide-react";
import { getCurrentUser } from "../services/usersService";
import { markNotificationsAsRead } from "../services/notificationsService";
import { useAuth } from "../hooks/useAuth";

import "../pagescss/header.css";

export default function Header({ user, onRestrictedAction, headerRightRef }) {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated } = useAuth();
  const [openNotif, setOpenNotif] = useState(false);
  const [userData, setUserData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const currentUser = user || authUser || null;

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.activo === 0) {
      alert('Tu cuenta ha sido desactivada. Serás redirigido al acceso.');
      navigate('/acceso');
    }
  }, [currentUser, navigate]);

  const fetchUserData = async () => {
    try {
      const data = await getCurrentUser();
      setUserData(data);
    } catch (err) {
      console.error('Error cargando datos del usuario:', err);
    }
  };

  useEffect(() => {
    (async () => { await fetchUserData(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenNotif = () => {
    (async () => {
      try {
        await markNotificationsAsRead();
      } catch (e) {
        console.error('Error marcando notificaciones leidas:', e);
      } finally {
        await fetchUserData();
        setOpenNotif(true);
      }
    })();
  };

  const handleRefresh = async () => {
    await fetchUserData();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleIconClick = (target) => {
    if (currentUser) {
      if (target === "notificaciones") handleOpenNotif();
      if (target === "perfil") navigate("/perfil");
      if (target === "configuracion") navigate("/configuracion");
    } else {
      onRestrictedAction?.();
    }
  };

  return (
    <>
      <header className="header-container">
        <div className="header-left">
          <div className="logo" onClick={() => navigate("/")}>
            <div className="logo-circle">
              <img src={"/icono.png"} alt="Inicio" className="home-img" />
            </div>
          </div>

          <span className="app-title">NextRead</span>

          <div className="search-wrapper">
            <SearchBar />
          </div>
        </div>

        <div className="header-right" ref={headerRightRef}>
          <button
            className="icon-btn"
            title="Configuración"
            onClick={() => handleIconClick("configuracion")}
          >
            <Settings size={24} className="settings-icon" />
          </button>

          <button
            className={`icon-btn ${((userData?.notificaciones || []).filter(n => !n.leido).length > 0) ? 'with-badge' : ''}`}
            title="Notificaciones"
            onClick={() => handleIconClick("notificaciones")}
          >
            <Bell size={24} className="bell-icon" />
            {((userData?.notificaciones || []).filter(n => !n.leido).length > 0) && <span className="notif-badge" />}
          </button>

          <div
            className="profile-box"
            onClick={() => handleIconClick("perfil")}
            title={currentUser ? "Ir al perfil" : "Necesitas una cuenta"}
          >
            <User size={22} className="user-icon" />
            <span className="username">{currentUser?.nombre || "Invitado"}</span>
          </div>
        </div>
      </header>

      <NotificacionesModal
        open={openNotif}
        close={() => setOpenNotif(false)}
        userData={userData}
        onRefresh={handleRefresh}
      />
    </>
  );
}
