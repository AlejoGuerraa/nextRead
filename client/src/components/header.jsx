// header.jsx
import { useNavigate } from "react-router-dom";
import SearchBar from "./busqueda";
import NotificacionesModal from "./notificaciones/NotificacionesModal";
import { useState, useEffect, useRef } from "react";
import { Bell, User, Settings, Menu, X } from "lucide-react";
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
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const internalHeaderRef = useRef(null);
  const menuToggleRef = useRef(null);
  const actionsRef = headerRightRef || internalHeaderRef;

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
  }, [isAuthenticated]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!actionsRef.current?.contains(event.target)) setMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen, actionsRef]);

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

  const handleActionClick = (target) => {
    setMenuOpen(false);
    handleIconClick(target);
  };

  const handleHeaderKeyDown = (event) => {
    if (event.key === "Escape" && menuOpen) {
      setMenuOpen(false);
      menuToggleRef.current?.focus();
    }
  };

  return (
    <>
      <header className="header-container" onKeyDown={handleHeaderKeyDown}>
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

        <div className="header-right" ref={actionsRef}>
          <button
            ref={menuToggleRef}
            className="header-menu-toggle"
            type="button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="header-actions-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
          </button>

          <nav
            id="header-actions-menu"
            className={`header-actions-menu${menuOpen ? " is-open" : ""}`}
            aria-label="Accesos de cuenta"
          >
            <button
              className="icon-btn profile-box header-action profile-action"
              type="button"
              title={isAuthenticated && authUser ? "Ir al perfil" : "Necesitas una cuenta"}
              aria-label="Perfil"
              onClick={() => handleActionClick("perfil")}
            >
              {isAuthenticated && avatarSrc && !avatarFailed ? (
                <img
                  src={avatarSrc}
                  alt=""
                  className="profile-avatar"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <User size={22} className="user-icon" aria-hidden="true" />
              )}
              <span className="header-action-label">Perfil</span>
              <span className="username">
                {loading && !profileName ? "Cargando..." : profileName || "Invitado"}
              </span>
            </button>

            <button
              className={`icon-btn header-action notifications-action ${((userData?.notificaciones || []).filter(n => !n.leido).length > 0) ? "with-badge" : ""}`}
              type="button"
              title="Notificaciones"
              aria-label="Notificaciones"
              onClick={() => handleActionClick("notificaciones")}
            >
              <Bell size={24} className="bell-icon" aria-hidden="true" />
              <span className="header-action-label">Notificaciones</span>
              {((userData?.notificaciones || []).filter(n => !n.leido).length > 0) && <span className="notif-badge" />}
            </button>

            <button
              className="icon-btn header-action settings-action"
              type="button"
              title="Configuración"
              aria-label="Configuración"
              onClick={() => handleActionClick("configuracion")}
            >
              <Settings size={24} className="settings-icon" aria-hidden="true" />
              <span className="header-action-label">Configuración</span>
            </button>
          </nav>
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
