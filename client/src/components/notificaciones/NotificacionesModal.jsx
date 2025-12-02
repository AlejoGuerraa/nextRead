import React, { useState, useEffect } from "react";
import { Modal } from "../acceso/modal";
import "../../pagescss/notificaciones.css";
import axios from "axios";

export default function NotificacionesModal({ open, close, data, onRefresh, userData }) {
    const notificaciones = (userData?.notificaciones) || (data?.notificaciones) || [];
    const visibleNotificaciones = notificaciones.filter(n => ['new_like', 'follow'].includes(n.meta?.type));
    const [userMap, setUserMap] = useState({});

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
                } catch (_) {}
            }
            setUserMap(map);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notificaciones]);

    return (
        <Modal openModal={open} closeModal={close} extraClass="notif-modal">
            <div className="notif-container">
                <h2 className="notif-title">Notificaciones</h2>

                {visibleNotificaciones.length === 0 ? (
                    <p className="notif-empty">No tenés notificaciones por ahora.</p>
                ) : (
                    <div className="notif-list">
                        {visibleNotificaciones.map((n) => {
                            const meta = n.meta || {};
                            const user = userMap[meta.fromUser];

                            return (
                                <div key={n.id} className="notif-item">

                                    {/* Avatar */}
                                    <div className="notif-avatar">
                                        {user ? (
                                            <img
                                                src={getAvatarSrc(user.iconoData?.simbolo || user.idIcono)}
                                                alt={user.usuario || n.nombre}
                                                onError={(e) => { e.target.src = "/iconos/LogoDefault1.jpg"; }}
                                            />
                                        ) : (
                                            <span>{n.nombre?.charAt(0).toUpperCase() || "?"}</span>
                                        )}
                                    </div>

                                    {/* Texto */}
                                    <div className="notif-text">
                                        <strong>{n.nombre || "Sistema"}</strong> {n.mensaje}
                                        <span className="notif-date">
                                            {new Date(n.fecha).toLocaleString("es-AR", {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            })}
                                        </span>
                                    </div>

                                    {/* Estado */}
                                    {meta.type === "new_like" && (
                                        <span className="notif-status notif-like">❤️ Like</span>
                                    )}

                                    {meta.type === "follow" && (
                                        <span className="notif-status notif-follow">👤 Te siguió</span>
                                    )}

                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
}
