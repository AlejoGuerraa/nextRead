// header.jsx
import { useNavigate } from "react-router-dom";
import SearchBar from "./busqueda";
import NotificacionesModal from "./notificaciones/NotificacionesModal";
import { useState, useEffect } from "react";
import { Bell, User, Settings } from "lucide-react";
import { getCurrentUser } from "../services/usersService";
import { markNotificationsAsRead } from "../services/notificationsService";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "./ToastProvider";

import "../pagescss/header.css";

export default function Header({ user, onRestrictedAction, headerRightRef }) {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated, loading } = useAuth();
  const { push } = useToast();
  const [openNotif, setOpenNotif] = useState(false);
  const [userData, setUserData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const currentUser = authUser || (loading ? user : null);
  const profileName = currentUser?.nombre || currentUser?.usuario;
  const profileIcon = isAuthenticated
    ? userData?.iconoData?.simbolo || userData?.icono || currentUser?.iconoData?.simbolo || currentUser?.icono
    : null;

  const avatarSrc = (() => {
    if (typeof profileIcon !== 'string' || !profileIcon.trim()) return null;
    if (profileIcon.startsWith('/') || profileIcon.startsWith('http')) return profileIcon;
    return `/iconos/${profileIcon}`;
  })();

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarSrc]);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.activo === 0) {
      push('Tu cuenta ha sido desactivada. Serás redirigido al acceso.', 'warning');
      navigate('/acceso');
    }
  }, [currentUser, navigate, push]);

  const fetchUserData = async () => {
    try {
      const data = await getCurrentUser();
      setUserData(data);
    } catch (err) {
      console.error('Error cargando datos del usuario:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setUserData(null);
      return;
    }

    (async () => { await fetchUserData(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
    if (isAuthenticated && authUser) {
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
            title={isAuthenticated && authUser ? "Ir al perfil" : "Necesitas una cuenta"}
          >
            {isAuthenticated && avatarSrc && !avatarFailed ? (
              <img
                src={avatarSrc}
                alt={`Foto de perfil de ${profileName || 'usuario'}`}
                className="profile-avatar"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <User size={22} className="user-icon" aria-hidden="true" />
            )}
            <span className="username">
              {loading && !profileName ? "Cargando..." : profileName || "Invitado"}
            </span>
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
