import React, { useState } from "react";
import { Modal } from "../acceso/modal";
import "../../pagescss/notificaciones.css";
import axios from "axios";

export default function NotificacionesModal({ open, close, data, onRefresh }) {
    const notificaciones = data?.notificaciones || [];
    const [loadingIds, setLoadingIds] = useState(new Set());

    const BASE_URL = "http://localhost:3000/nextread";

    const token = (() => {
        try {
            const s = localStorage.getItem("user");
            return s ? JSON.parse(s).token : null;
        } catch {
            return null;
        }
    })();

    const handleRespond = async (requestId, accion) => {
        if (!token || !requestId) return;

        setLoadingIds((prev) => new Set([...prev, requestId]));

        try {
            await axios.patch(
                `${BASE_URL}/follow/${requestId}`,
                { accion },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refrescar datos y dejar que Header reabra el modal con datos frescos
            await onRefresh?.();
        } catch (err) {
            console.error("Error responding follow request", err?.response?.data || err);
            alert(err?.response?.data?.error || "Error procesando la solicitud");
            setLoadingIds((prev) => {
                const s = new Set(prev);
                s.delete(requestId);
                return s;
            });
        }
    };

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

                {notificaciones.length === 0 ? (
                    <p className="notif-empty">No tenés notificaciones por ahora.</p>
                ) : (
                    <div className="notif-list">
                        {notificaciones.map((n) => {
                            const meta = n.meta || {};

                            // Determinar estado de la solicitud de seguimiento.
                            // Consideramos explícitamente el campo `meta.status` para cubrir
                            // tanto notificaciones con type 'follow_request' como 'follow_response'.
                            const isFollowPending =
                                meta.type === "follow_request" &&
                                meta.requestId &&
                                (!meta.status || meta.status === 'enviado');

                            const isFollowAccepted = meta.requestId && meta.status === 'aceptado';
                            const isFollowRejected = meta.requestId && meta.status === 'rechazado';
                            const isClickable = meta.type === "new_comment";

                            return (
                                <div
                                    key={n.id}
                                    className={`notif-item ${isClickable ? "clickable" : ""}`}
                                    onClick={isClickable ? () => handleCommentClick(n) : undefined}
                                >
                                    {/* Avatar */}
                                    <div className="notif-avatar">
                                        {n.nombre ? n.nombre.charAt(0).toUpperCase() : "S"}
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

                                        {isFollowPending && (
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <button
                                                    className="btn-accept"
                                                    disabled={loadingIds.has(meta.requestId)}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRespond(meta.requestId, "aceptar");
                                                    }}
                                                >
                                                    Aceptar
                                                </button>

                                                <button
                                                    className="btn-reject"
                                                    disabled={loadingIds.has(meta.requestId)}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRespond(meta.requestId, "rechazar");
                                                    }}
                                                >
                                                    Rechazar
                                                </button>
                                            </div>
                                        )}

                                        {isFollowAccepted && (
                                            <span className="notif-status accepted">
                                                Has aceptado la solicitud de {n.nombre}
                                            </span>
                                        )}
                                        {isFollowRejected && (
                                            <span className="notif-status rejected">
                                                Has rechazado la solicitud de {n.nombre}
                                            </span>
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