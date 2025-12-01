import React, { useState } from "react";
import { Modal } from "../acceso/modal";
import "../../pagescss/notificaciones.css";
import axios from 'axios';

export default function NotificacionesModal({ open, close, data, onRefresh }) {
    const notificaciones = data?.notificaciones || [];
    const [loadingIds, setLoadingIds] = useState(new Set());
    
    // Asumiendo que obtienes la URL base de tu aplicación de alguna manera
    const BASE_URL = 'http://localhost:3000/nextread'; 

    const token = localStorage.getItem('token');
  
    const handleRespond = async (requestId, accion) => {
        if (!token || !requestId) return;
        setLoadingIds(prev => new Set([...prev, requestId]));
        try {
            await axios.patch(
                `${BASE_URL}/follow/${requestId}`, 
                { accion }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            close();
            onRefresh?.();
        } catch (err) {
            console.error('Error responding follow request', err?.response?.data || err);
            alert(err?.response?.data?.error || 'Error procesando la solicitud');
        } finally {
            setLoadingIds(prev => { const s = new Set(prev); s.delete(requestId); return s; });
        }
    };

    // Nueva función para manejar el clic en notificaciones de "Comentario"
    const handleCommentClick = (n) => {
        if (n.meta?.type === 'new_comment' && n.meta.bookId) {
            // Aquí deberías redirigir al usuario a la página del libro o la reseña
            // Ejemplo: window.location.href = `/libro/${n.meta.bookId}#comentario-${n.meta.commentId}`;
            
            alert(`Navegando a la reseña del libro ID: ${n.meta.bookId}`);
            close(); // Cerrar el modal al navegar
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
                            
                            let isFollowRequest = n.meta?.type === 'follow_request' && n.meta?.requestId;
                            let isNewComment = n.meta?.type === 'new_comment' && n.meta?.bookId;
                            
                            // Determinar si la notificación es "cliqueable"
                            const isClickable = isNewComment;

                            return (
                                <div 
                                    key={n.id} 
                                    className={`notif-item ${isClickable ? 'clickable' : ''}`}
                                    onClick={isClickable ? () => handleCommentClick(n) : undefined}
                                >
                                    {/* Avatar del remitente */}
                                    <div className="notif-avatar">
                                        {n.nombre ? n.nombre.charAt(0).toUpperCase() : 'S'}
                                    </div>

                                    {/* Texto de la notificación */}
                                    <div className="notif-text">
                                        {/* Modificación en el mensaje para manejar el caso de 'Sistema' o un mensaje directo */}
                                        <strong>{n.nombre || "Sistema"}</strong> {n.mensaje.replace(`${n.nombre} `, '')}
                                    </div>

                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span className="notif-date">
                                            {new Date(n.fecha).toLocaleString("es-AR", {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            })}
                                        </span>
                                        
                                        {/* LÓGICA DE RESPUESTA A SOLICITUD DE SEGUIMIENTO */}
                                        {isFollowRequest && (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button 
                                                    className="btn-accept" 
                                                    disabled={loadingIds.has(n.meta.requestId)} 
                                                    onClick={(e) => { e.stopPropagation(); handleRespond(n.meta.requestId, 'aceptar'); }}
                                                >Aceptar</button>
                                                <button 
                                                    className="btn-reject" 
                                                    disabled={loadingIds.has(n.meta.requestId)} 
                                                    onClick={(e) => { e.stopPropagation(); handleRespond(n.meta.requestId, 'rechazar'); }}
                                                >Rechazar</button>
                                            </div>
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