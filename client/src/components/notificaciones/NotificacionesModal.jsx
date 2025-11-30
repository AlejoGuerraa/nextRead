import React, { useState } from "react";
import { Modal } from "../acceso/modal";
import "../../pagescss/notificaciones.css";
import axios from 'axios';

export default function NotificacionesModal({ open, close, data, onRefresh }) {
  const nombreUsuario = data?.nombre || "Vos";
  const notificaciones = data?.notificaciones || [];
  const [loadingIds, setLoadingIds] = useState(new Set());

  const token = (() => { try { const s = localStorage.getItem('user'); return s ? JSON.parse(s).token : null; } catch { return null; } })();

  const handleRespond = async (requestId, accion) => {
    if (!token || !requestId) return;
    setLoadingIds(prev => new Set([...prev, requestId]));
    try {
      await axios.patch(`http://localhost:3000/nextread/follow/${requestId}`, { accion }, { headers: { Authorization: `Bearer ${token}` } });
      // refresh parent (reload user/notifications)
      onRefresh?.();
    } catch (err) {
      console.error('Error responding follow request', err?.response?.data || err);
      alert(err?.response?.data?.error || 'Error procesando la solicitud');
    } finally {
      setLoadingIds(prev => { const s = new Set(prev); s.delete(requestId); return s; });
    }
  };

  return (
    <Modal openModal={open} closeModal={close} extraClass="notif-modal">
      <div className="notif-container">
        <h2>Notificaciones</h2>

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

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="notif-date">
                  {new Date(n.fecha).toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                  </span>
                  {/* If this notification contains a follow request, show accept/reject */}
                  {n.meta?.type === 'follow_request' && n.meta?.requestId && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-accept" disabled={loadingIds.has(n.meta.requestId)} onClick={() => handleRespond(n.meta.requestId, 'aceptar')}>Aceptar</button>
                      <button className="btn-reject" disabled={loadingIds.has(n.meta.requestId)} onClick={() => handleRespond(n.meta.requestId, 'rechazar')}>Rechazar</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
