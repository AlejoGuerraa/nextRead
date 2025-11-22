// File: src/pages/Configuracion.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";

import ChangeEmail from "../components/settings/ChangeEmail";
import ChangePassword from "../components/settings/ChangePassword";
import EmailPreferences from "../components/settings/EmailPreferences";
import DeleteAccount from "../components/settings/DeleteAccount";
import AdminBanUser from "../components/settings/AdminBanUser";

import "../pagescss/configuracion.css";

export default function Configuracion() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      setUser(null);
    }
  }, []);

  const isAdmin = user?.rol === 'admin' || user?.role === 'admin';

  return (
    <div className="pagina-configuracion">
      <Header />

      <main className="config-wrapper">
        <h1>Configuración</h1>

        <div className="config-grid">
          <div className="left-col">
            <ChangeEmail />
            <ChangePassword />
            <EmailPreferences />
            <DeleteAccount />
          </div>

          <aside className="right-col">
            <div className="card">
              <h4>Resumen de seguridad</h4>
              <p className="muted">Revisa tus sesiones activas y considera activar 2FA para mayor seguridad.</p>
              <button className="btn-secondary" onClick={() => alert('Abrir modal sesiones (placeholder)')}>Ver sesiones</button>
            </div>

            {isAdmin && (
              <div className="card admin-area">
                <AdminBanUser />
              </div>
            )}
          </aside>
        </div>

        <div className="backend-note">
          <p>
            <strong>IMPORTANTE:</strong> Todo lo anterior debe conectarse con el backend. El baneo de usuarios debe setear <code>isActive</code> en <code>false</code> (no borrar la cuenta de la base de datos); además se debe enviar un correo al usuario y, cuando intente iniciar sesión, mostrarle un mensaje claro indicando que su cuenta está inactiva.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

