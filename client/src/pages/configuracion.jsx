// File: src/pages/Configuracion.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import RestrictionPopover from "../components/popOver";

import ChangeEmail from "../components/settings/ChangeEmail";
import ChangePassword from "../components/settings/ChangePassword";
import EmailPreferences from "../components/settings/EmailPreferences";
import DeleteAccount from "../components/settings/DeleteAccount";
import AdminBanUser from "../components/settings/AdminBanUser";

import "../pagescss/configuracion.css";

export default function Configuracion() {
  const initialUser = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const [user, setUser] = useState(initialUser);
  const navigate = useNavigate();

  // Popover para acciones restringidas (si el usuario no está logueado)
  const popoverRef = React.useRef(null);

  const handleRestrictedAction = () => {
    setShowPopover(true);
    setPopoverOpacity(1);
  };

  // Mostrar popover sólo si el usuario NO está autenticado (evaluado sincronamente)
  const [showPopover, setShowPopover] = useState(!initialUser);
  const [popoverOpacity, setPopoverOpacity] = useState(!initialUser ? 1 : 0);

  const isAdmin = user?.rol === "admin" || user?.role === "admin";

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/acceso");
  };

  // 🔍 REVISAR SI LA CUENTA ESTÁ ACTIVA
  useEffect(() => {
    if (!user) return;

    if (user.activo === 0) {
      alert("Tu cuenta fue desactivada. Serás redirigido al acceso.");

      // Borrar datos locales
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      navigate("/acceso");
    }
  }, [user]);


  return (
    <div className="pagina-configuracion">
      <Header user={user} onRestrictedAction={handleRestrictedAction} />

      {showPopover && (
        <div
          ref={popoverRef}
          className="restriction-popover-wrapper"
          style={{
            opacity: popoverOpacity,
            pointerEvents: "auto",
            position: "fixed",
            top: "80px",
            right: "40px",
            zIndex: 9999,
          }}
        >
          <RestrictionPopover />
        </div>
      )}

      <main className="config-wrapper">
        {/* Contenedor central con card visual */}
        <div className="config-main-card">
          <div className="config-header">
            <div className="config-title">
              <h1>Configuración</h1>
              <p className="subtitle">Ajusta tu cuenta, seguridad y preferencias de correo.</p>
            </div>

            {/* Botón de deslogueo ahora integrado al header de la página de configuración */}
            <div className="config-actions">
              <button
                className="btn-logout-inline"
                onClick={handleLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                Cerrar sesión
              </button>
            </div>
          </div>

          <div className="config-grid">
            <div className="left-col">
              <ChangeEmail />
              <ChangePassword />
              <EmailPreferences />
              <DeleteAccount />
            </div>

            <aside className="right-col" aria-label="Panel secundario">
              <div className="sticky-aside">
                {isAdmin && (
                  <div className="card admin-area">
                    <h4>Área de administración</h4>
                    <AdminBanUser />
                  </div>
                )}

                <div className="card help-card">
                  <h4>Ayuda rápida</h4>
                  <p className="muted small">
                    Para cambios vinculados al email o seguridad se requiere revalidar desde el backend.
                    En producción mostrar confirmaciones claras y enviar correos de seguridad.
                  </p>
                </div>
              </div>
            </aside>
          </div>

          <div className="backend-note">
            <p>
              <strong>IMPORTANTE:</strong> Todo lo anterior debe conectarse con el backend. El baneo de usuarios
              debe setear <code>isActive</code> en <code>false</code> (no borrar la cuenta de la base de datos);
              además enviar un correo al usuario y, cuando intente iniciar sesión, mostrar un mensaje claro
              indicando que su cuenta está inactiva.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
