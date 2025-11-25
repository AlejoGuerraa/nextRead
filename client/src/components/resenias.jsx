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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userData = JSON.parse(localStorage.getItem("user"));
        const token = userData?.token;
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
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
