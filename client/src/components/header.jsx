// header.jsx
import { useNavigate } from "react-router-dom";
import SearchBar from "./busqueda";
import NotificacionesModal from "./notificaciones/NotificacionesModal";
import { useState, useEffect } from "react";
import { Bell, User, Settings } from "lucide-react";

// IMPORTAMOS LA IMAGEN
import libroIcono from "../assets/libroIcono.png";

// IMPORTAMOS EL CSS SEPARADO
import "../pagescss/header.css";

export default function Header({ user, onRestrictedAction, headerRightRef }) {
  const navigate = useNavigate();
  const [openNotif, setOpenNotif] = useState(false);
  const [userData, setUserData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fallback: si no se pasa user por props, intentar leer de localStorage
  const currentUser =
    user ||
    (() => {
      try {
        const s = localStorage.getItem("user");
        return s ? JSON.parse(s) : null;
      } catch {
        return null;
      }
    })();

  // Redirigir si la cuenta se encuentra desactivada
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.activo === 0) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (_){ }
      alert('Tu cuenta ha sido desactivada. Serás redirigido al acceso.');
      navigate('/acceso');
    }
  }, [currentUser, navigate]);

  // Cargar notificaciones del usuario actual
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://localhost:3000/nextread/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const json = await res.json();
      setUserData(json);
    } catch (err) {
      console.error('Error cargando datos del usuario:', err);
    }
  };

  // Inicializar userData al montar para mostrar badge
  useEffect(() => {
    (async () => { await fetchUserData(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Abrir modal y forzar refresh de notificaciones
  const handleOpenNotif = () => {
    // Marcar notificaciones como leídas en el servidor y luego recargar datos
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await fetch('http://localhost:3000/nextread/notificaciones/marcar-leidas', {
            method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
          });
        }
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
        {/* IZQUIERDA */}
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

        {/* DERECHA */}
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
