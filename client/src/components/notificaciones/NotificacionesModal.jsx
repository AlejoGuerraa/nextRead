import React, { useState, useEffect } from "react";
import { Modal } from "../acceso/modal";
import "../../pagescss/notificaciones.css";
import axios from "axios";

export default function NotificacionesModal({ open, close, data, onRefresh, userData }) {
    const notificaciones = (userData?.notificaciones) || (data?.notificaciones) || [];
    const visibleNotificaciones = notificaciones.filter(n => ['new_like', 'follow'].includes(n.meta?.type));
    const [userMap, setUserMap] = useState({}); // cache id -> user public data

    // helper to build avatar src like in resenias
    const getAvatarSrc = (rawIcon) => {
        let avatarSrc = "/iconos/LogoDefault1.jpg";
        if (rawIcon) {
            if (typeof rawIcon === 'string') {
                if (rawIcon.startsWith('/') || rawIcon.startsWith('http')) {
                    avatarSrc = rawIcon;
                } else {
                    avatarSrc = `/iconos/${rawIcon}`;
                }
            }
        }
        return avatarSrc;
    };

    // Fetch minimal public user info for all fromUser ids found in notificaciones
    useEffect(() => {
        const ids = [...new Set(notificaciones.map(n => n.meta?.fromUser).filter(Boolean))];
        if (ids.length === 0) return;

        (async () => {
            const map = { ...userMap };
            for (const id of ids) {
                if (map[id]) continue;
                try {
                    const res = await axios.get(`http://localhost:3000/nextread/user/public/${id}`);
                    if (res?.data) map[id] = res.data;
                } catch (e) {
                    // ignore per-user errors
                }
            }
            setUserMap(map);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notificaciones]);

    const handleCommentClick = (n) => {
        if (n.meta?.type === "new_comment" && n.meta.bookId) {
            alert(`Ir a reseña del libro ID: ${n.meta.bookId}`);
            close();
        }
    };

    return (
        <Modal openModal={open} closeModal={close} extraClass="notif-modal">
            <div className="notif-container">
                <h2>Notificaciones</h2>

                {visibleNotificaciones.length === 0 ? (
                    <p className="notif-empty">No tenés notificaciones por ahora.</p>
                ) : (
                    <div className="notif-list">
                        {visibleNotificaciones.map((n) => {
                            const meta = n.meta || {};

                            const isClickable = meta.type === "new_comment";

                            return (
                                <div
                                    key={n.id}
                                    className={`notif-item ${isClickable ? "clickable" : ""}`}
                                    onClick={isClickable ? () => handleCommentClick(n) : undefined}
                                >
                                    {/* Avatar */}
                                    <div className="notif-avatar">
                                        {n.meta?.fromUser && userMap[n.meta.fromUser] ? (
                                            <img
                                                src={getAvatarSrc(userMap[n.meta.fromUser].iconoData?.simbolo || userMap[n.meta.fromUser].idIcono)}
                                                alt={userMap[n.meta.fromUser].usuario || n.nombre}
                                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.src = '/iconos/LogoDefault1.jpg'; }}
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 700 }}>{n.nombre ? n.nombre.charAt(0).toUpperCase() : 'S'}</span>
                                        )}
                                    </div>

                                    {/* Texto */}
                                    <div className="notif-text">
                                        <strong>{n.nombre || "Sistema"}:</strong>{" "}
                                        {n.mensaje}
                                    </div>

                                    {/* Fecha + botones o mensaje de estado */}
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <span className="notif-date">
                                            {new Date(n.fecha).toLocaleString("es-AR", {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            })}
                                        </span>

                                            {/* Notificaciones de likes */}
                                            {meta.type === 'new_like' && (
                                                <span className="notif-status like">❤️ Like</span>
                                            )}

                                            {meta.type === 'follow' && (
                                                <span className="notif-status follow">👤 Nuevo seguidor</span>
                                            )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
}