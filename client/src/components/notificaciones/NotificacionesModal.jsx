import React from "react";
import { Modal } from "../acceso/modal";
import "../../pagescss/notificaciones.css";

export default function NotificacionesModal({ open, close, data }) {
  const nombreUsuario = data?.nombre || "Vos";
  const notificaciones = data?.notificaciones || [];

  return (
    <Modal openModal={open} closeModal={close} extraClass="notif-modal">
      <div className="notif-container">
        <h2>🔔 Notificaciones</h2>

        {notificaciones.length === 0 ? (
          <p className="notif-empty">No tenés notificaciones por ahora.</p>
        ) : (
          <div className="notif-list">
            {notificaciones.map((n) => (
              <div key={n.id} className="notif-item">
                <div className="notif-avatar">
                  {nombreUsuario.charAt(0).toUpperCase()}
                </div>

                <div className="notif-text">
                  <strong>{nombreUsuario}</strong> {n.mensaje}
                </div>

                <span className="notif-date">
                  {new Date(n.fecha).toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
