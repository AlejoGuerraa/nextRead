import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useToast } from './ToastProvider';

const API_BASE = "http://localhost:3000/nextread";

function starsFromRating(r) {
    const n = Number(r) || 0;
    return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
}

export default function Resenas() {
    const { id } = useParams();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();
    const [likedResenas, setLikedResenas] = useState(() => {
        try {
            const raw = localStorage.getItem('likedResenas');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    });
    const [likingIds, setLikingIds] = useState([]);
    const [currentUser, setCurrentUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
    });

    // Modal state for admin deletion
    const [modalResenaId, setModalResenaId] = useState(null);
    const [modalDescargo, setModalDescargo] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/resenas/${id}`);
            setReviews(res.data || []);
            setError(null);
        } catch (err) {
            console.error("Error fetching reviews:", err);
            setError("No se pudieron cargar las reseñas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchReviews();
    }, [id]);

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

    // Ensure we have a fresh user object from the server when possible (avoids stale localStorage issues)
    useEffect(() => {
        const init = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(`${API_BASE}/user`, { headers: { Authorization: `Bearer ${token}` } });
                if (res?.data) {
                    setCurrentUser(res.data);
                    // keep localStorage in sync
                    try { localStorage.setItem('user', JSON.stringify(res.data)); } catch (_) {}
                }
            } catch (err) {
                // ignore — we'll fall back to localStorage
            }
        };
        init();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            toast?.push("Debes iniciar sesión para publicar una reseña.", 'error');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(
                `${API_BASE}/resena/${id}`,
                { puntuacion: rating, comentario: comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setComment("");
            setRating(5);
            // Refresh reviews
            await fetchReviews();
        } catch (err) {
            console.error("Error submitting review:", err);
            toast?.push(err.response?.data?.error || "Error al enviar la reseña.", 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (resenaId) => {
        const idNum = Number(resenaId);
        
        // Prevenir doble click / ya está en vuelo
        if (likingIds.includes(idNum)) return;

        const token = localStorage.getItem('token');
        if (!token) {
            toast?.push('Debes iniciar sesión para dar like', 'error');
            return;
        }

        // Marcar como en-vuelo INMEDIATAMENTE
        setLikingIds(prev => [...prev, idNum]);

        try {
            const isAlreadyLiked = likedResenas.map(Number).includes(idNum);

            if (isAlreadyLiked) {
                // Ya likeado: hacer DELETE al servidor para quitar like
                await axios.delete(`${API_BASE}/resena/${idNum}/like`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Actualizar estado local
                const newLiked = likedResenas.filter(id => Number(id) !== idNum);
                setLikedResenas(newLiked);
                localStorage.setItem('likedResenas', JSON.stringify(newLiked));
                
                // Actualizar contador localmente
                setReviews(prev => prev.map(r => r.id === idNum ? { ...r, likes: Math.max(0, (r.likes || 0) - 1) } : r));
            } else {
                // No likeado: hacer POST al servidor para agregar like
                const res = await axios.post(`${API_BASE}/resena/${idNum}/like`, null, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Actualizar estado local
                const newLiked = Array.from(new Set([...likedResenas.map(Number), idNum]));
                setLikedResenas(newLiked);
                localStorage.setItem('likedResenas', JSON.stringify(newLiked));
                
                // Actualizar contador desde la respuesta
                setReviews(prev => prev.map(r => r.id === idNum ? { ...r, likes: res.data.likes } : r));
            }
        } catch (err) {
            console.error('Error al procesar like:', err);
            
            // Revertir cambio local en caso de error
            const isAlreadyLiked = likedResenas.map(Number).includes(idNum);
            if (!isAlreadyLiked) {
                // Si intentamos agregar y falla, lo quitamos del estado local
                setLikedResenas(prev => prev.filter(id => Number(id) !== idNum));
                localStorage.setItem('likedResenas', JSON.stringify(likedResenas.filter(id => Number(id) !== idNum)));
            }
        } finally {
            // Limpiar likingIds al final, después de que TODO se resuelva
            setLikingIds(prev => prev.filter(x => x !== idNum));
        }
    };

    const openDeleteModal = (resenaId) => {
        setModalResenaId(resenaId);
        setModalDescargo('');
    };

    const closeDeleteModal = () => {
        setModalResenaId(null);
        setModalDescargo('');
    };

    const confirmDeleteAsAdmin = async () => {
        if (!modalResenaId) return;
        setModalLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast?.push('No estás autenticado', 'error');
                setModalLoading(false);
                return;
            }

            await axios.delete(`${API_BASE}/admin/resena/${modalResenaId}`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { descargo: modalDescargo }
            });

            toast?.push('Reseña eliminada y usuario suspendido', 'success');
            closeDeleteModal();
            await fetchReviews();
        } catch (err) {
            console.error('Error eliminando reseña como admin:', err);
            toast?.push(err.response?.data?.error || 'Error al eliminar reseña', 'error');
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div className="comentarios-section">
            <h3>Reseñas</h3>

            <form className="resena-form" onSubmit={handleSubmit}>
                <label style={{ display: 'block', marginBottom: 6 }}>Tu valoración:</label>
                <div style={{ marginBottom: 8 }}>
                    {Array.from({ length: 5 }, (_, i) => {
                        const val = i + 1;
                        return (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setRating(val)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: 20,
                                    cursor: 'pointer',
                                    color: val <= rating ? '#ffb400' : '#999'
                                }}
                                aria-label={`Puntuar ${val}`}
                            >
                                ★
                            </button>
                        );
                    })}
                    <span style={{ marginLeft: 8, color: '#406882' }}>({rating})</span>
                </div>

                <label style={{ display: 'block', marginBottom: 6 }}>Comentario (opcional):</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Escribe tu opinión sobre el libro..."
                    style={{ width: '100%', marginBottom: 8 }}
                />

                <div>
                    <button className="btn-primary" type="submit" disabled={submitting}>
                        {submitting ? 'Enviando...' : 'Publicar reseña'}
                    </button>
                </div>
            </form>

            <hr style={{ margin: '12px 0' }} />

            {loading && <p>Cargando reseñas...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && reviews.length === 0 && <p>No hay reseñas todavía. Sé el primero en opinar.</p>}

            <div className="lista-resenas">
                {reviews.map((r) => {
                    const usuario = r.Usuario || r.usuario || {};
                    const nombre = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || usuario.usuario || 'Usuario';
                    const rawIcon = usuario.iconoData?.simbolo || usuario.idIcono || null;
                    const avatar = getAvatarSrc(rawIcon);
                    const fecha = r.fecha ? new Date(r.fecha).toLocaleString() : '';

                    return (
                        <div className="comentario" key={r.id} style={{ display: 'flex', marginBottom: 12 }}>
                            <div className="comentario-avatar" style={{ marginRight: 10 }}>
                                <img
                                    src={avatar}
                                    alt={nombre}
                                    style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.src = '/iconos/LogoDefault1.jpg'; }}
                                />
                            </div>

                            <div className="comentario-contenido" style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <p className="comentario-usuario" style={{ fontWeight: 600, margin: 0 }}>{nombre}</p>
                                    <small style={{ color: '#666' }}>{fecha}</small>
                                </div>

                                <div className="comentario-estrellas" style={{ margin: '6px 0', color: '#ffb400' }}>
                                    {starsFromRating(r.puntuacion)}
                                </div>

                                {r.comentario ? (
                                    <p className="comentario-texto" style={{ margin: 0 }}>{r.comentario}</p>
                                ) : (
                                    <p className="comentario-texto" style={{ margin: 0, color: '#777', fontStyle: 'italic' }}>Sin comentario</p>
                                )}

                                {/* Likes / acciones */}
                                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button
                                        type="button"
                                        onClick={() => handleLike(r.id)}
                                        disabled={likingIds.includes(r.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: likingIds.includes(r.id) ? 'not-allowed' : 'pointer',
                                            color: likedResenas.includes(r.id) ? '#e74c3c' : '#999',
                                            fontSize: 20,
                                            opacity: likingIds.includes(r.id) ? 0.6 : 1,
                                            transition: 'color 0.2s'
                                        }}
                                        title={likedResenas.includes(r.id) ? 'Quitar like' : 'Dar like'}
                                        aria-label="Me gusta"
                                    >
                                        {likingIds.includes(r.id) ? '⏳' : '♥'}
                                    </button>

                                    <span style={{ color: '#666' }}>{r.likes || 0}</span>

                                    {/* Si el usuario es admin mostrar triángulo para eliminar */}
                                    {(currentUser?.rol && String(currentUser.rol).toLowerCase() === 'admin') && (
                                        <button
                                            type="button"
                                            title="Eliminar reseña y suspender usuario"
                                            onClick={() => openDeleteModal(r.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffcc00' }}
                                        >
                                            ⚠️
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal simple para confirmación de admin */}
            {modalResenaId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: '#fff', padding: 18, borderRadius: 8, width: 480, maxWidth: '90%' }}>
                        <h4 style={{ marginTop: 0 }}>Confirmar eliminación de reseña</h4>
                        <p>Estás por eliminar una reseña y suspender la cuenta del autor. Escribe aquí el descargo que se enviará por email:</p>
                        <textarea value={modalDescargo} onChange={(e) => setModalDescargo(e.target.value)} rows={5} style={{ width: '100%', marginBottom: 8 }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button onClick={closeDeleteModal} className="btn-outline">Cancelar</button>
                            <button onClick={confirmDeleteAsAdmin} className="btn-primary" disabled={modalLoading}>{modalLoading ? 'Procesando...' : 'Confirmar y suspender'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
