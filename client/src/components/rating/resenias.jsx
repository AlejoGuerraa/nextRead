import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Heart, Send, X } from "lucide-react";
import { useToast } from "../ToastProvider";
import { getCurrentUser } from "../../services/usersService";
import {
    createReview,
    createReviewReply,
    deleteOwnReview,
    deleteReviewAsAdmin,
    getBookReviews,
    likeReview,
    unlikeReview,
} from "../../services/reviewsService";
import "./resenias.css";

const starsFromRating = (rating) => {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    return "★".repeat(value) + "☆".repeat(5 - value);
};

const formatRelativeDate = (date) => {
    const timestamp = new Date(date).getTime();
    if (!Number.isFinite(timestamp)) return "";
    const elapsedSeconds = Math.round((timestamp - Date.now()) / 1000);
    const units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
    const formatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
    for (const [unit, seconds] of units) {
        if (Math.abs(elapsedSeconds) >= seconds) return formatter.format(Math.round(elapsedSeconds / seconds), unit);
    }
    return "ahora";
};

const getAvatarSrc = (user) => {
    const icon = user?.iconoData?.simbolo || user?.idIcono;
    if (typeof icon === "string" && (icon.startsWith("/") || icon.startsWith("http"))) return icon;
    if (icon) return `/iconos/${icon}`;
    return "/iconos/LogoDefault1.jpg";
};

export default function Resenas() {
    const { id } = useParams();
    const toast = useToast();
    const [reviews, setReviews] = useState([]);
    const [currentUser, setCurrentUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem("user")) || {}; } catch { return {}; }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [likingIds, setLikingIds] = useState([]);
    const [replyingId, setReplyingId] = useState(null);
    const [replyDrafts, setReplyDrafts] = useState({});
    const [replySubmittingId, setReplySubmittingId] = useState(null);
    const [modalResenaId, setModalResenaId] = useState(null);
    const [modalDescargo, setModalDescargo] = useState("");
    const [modalLoading, setModalLoading] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [deletingReviewId, setDeletingReviewId] = useState(null);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            setReviews((await getBookReviews(id)) || []);
            setError(null);
        } catch (fetchError) {
            console.error("Error fetching reviews:", fetchError);
            setError("No se pudieron cargar las reseñas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (id) fetchReviews(); }, [id]);

    useEffect(() => {
        if (!localStorage.getItem("token")) return;
        getCurrentUser().then((user) => {
            setCurrentUser(user);
            localStorage.setItem("user", JSON.stringify(user));
        }).catch(() => undefined);
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!localStorage.getItem("token")) {
            toast?.push("Debes iniciar sesión para publicar una reseña.", "error");
            return;
        }
        if (!comment.trim()) {
            toast?.push("La reseña no puede estar vacía.", "error");
            return;
        }
        setSubmitting(true);
        try {
            await createReview(id, { puntuacion: rating, comentario: comment });
            setComment("");
            await fetchReviews();
            toast?.push("Reseña publicada correctamente", "success");
        } catch (submitError) {
            toast?.push(submitError.response?.data?.error || "Error al enviar la reseña.", "error");
        } finally { setSubmitting(false); }
    };

    const handleLike = async (review) => {
        if (!localStorage.getItem("token")) {
            toast?.push("Debes iniciar sesión para dar like", "error");
            return;
        }
        if (likingIds.includes(review.id)) return;
        setLikingIds((current) => [...current, review.id]);
        try {
            const response = review.likedByCurrentUser ? await unlikeReview(review.id) : await likeReview(review.id);
            setReviews((current) => current.map((item) => item.id === review.id
                ? { ...item, likes: response.likes, likedByCurrentUser: response.liked }
                : item));
        } catch (likeError) {
            toast?.push(likeError.response?.data?.error || "No se pudo actualizar el like.", "error");
        } finally { setLikingIds((current) => current.filter((reviewId) => reviewId !== review.id)); }
    };

    const handleReplySubmit = async (event, reviewId) => {
        event.preventDefault();
        const comentario = (replyDrafts[reviewId] || "").trim();
        if (!comentario) return;
        setReplySubmittingId(reviewId);
        try {
            await createReviewReply(reviewId, comentario);
            setReplyDrafts((current) => ({ ...current, [reviewId]: "" }));
            setReplyingId(null);
            await fetchReviews();
            toast?.push("Respuesta publicada correctamente", "success");
        } catch (replyError) {
            toast?.push(replyError.response?.data?.error || "No se pudo publicar la respuesta.", "error");
        } finally { setReplySubmittingId(null); }
    };

    const confirmDeleteAsAdmin = async () => {
        if (!modalResenaId) return;
        setModalLoading(true);
        try {
            await deleteReviewAsAdmin(modalResenaId, modalDescargo);
            setModalResenaId(null);
            setModalDescargo("");
            await fetchReviews();
            toast?.push("Reseña eliminada y usuario suspendido", "success");
        } catch (deleteError) {
            toast?.push(deleteError.response?.data?.error || "Error al eliminar reseña", "error");
        } finally { setModalLoading(false); }
    };

    const handleDeleteOwnReview = async () => {
        if (!reviewToDelete) return;
        setDeletingReviewId(reviewToDelete);
        try {
            await deleteOwnReview(reviewToDelete);
            setReviewToDelete(null);
            await fetchReviews();
            toast?.push("Reseña eliminada correctamente", "success");
        } catch (deleteError) {
            toast?.push(deleteError.response?.data?.error || "No se pudo eliminar la reseña.", "error");
        } finally {
            setDeletingReviewId(null);
        }
    };

    return (
        <div className="comentarios-section">
            <h3>Reseñas</h3>
            <form className="resena-form" onSubmit={handleSubmit}>
                <label htmlFor="review-rating">Tu valoración:</label>
                <div id="review-rating" className="review-rating-picker">
                    {Array.from({ length: 5 }, (_, index) => {
                        const value = index + 1;
                        return <button key={value} type="button" onClick={() => setRating(value)} aria-label={`Puntuar ${value}`}>{value <= rating ? "★" : "☆"}</button>;
                    })}
                    <span>({rating})</span>
                </div>
                <label htmlFor="review-comment">Comentario (opcional):</label>
                <div className="review-comment-field">
                    <textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} rows={5} minLength={1} maxLength={300} placeholder="Escribe tu opinión sobre el libro..." />
                    <small>{comment.length}/300 caracteres</small>
                </div>
                <button className="btn-primary" type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Publicar reseña"}</button>
            </form>
            <hr />
            {loading && <p>Cargando reseñas...</p>}
            {error && <p className="error">{error}</p>}
            {!loading && reviews.length === 0 && <p>No hay reseñas todavía. Sé el primero en opinar.</p>}
            <div className="lista-resenas">
                {reviews.map((review) => {
                    const author = review.Usuario || {};
                    const displayName = author.usuario || "Usuario";
                    const isReplying = replyingId === review.id;
                    return (
                        <article className="comentario" key={review.id}>
                            <img className="comentario-avatar" src={getAvatarSrc(author)} alt={displayName} />
                            <div className="comentario-contenido">
                                <div className="comentario-cabecera"><strong className="comentario-usuario">{displayName}</strong><small>{formatRelativeDate(review.fecha)}</small></div>
                                <div className="comentario-estrellas">{starsFromRating(review.puntuacion)}</div>
                                <p className="comentario-texto">{review.comentario || "Sin comentario"}</p>
                                <div className="resena-acciones">
                                    <button type="button" onClick={() => handleLike(review)} disabled={likingIds.includes(review.id)} className={review.likedByCurrentUser ? "is-liked" : ""} aria-label={review.likedByCurrentUser ? "Quitar like" : "Dar like"}>
                                        <Heart size={17} fill={review.likedByCurrentUser ? "currentColor" : "none"} /><span>{review.likes || 0}</span>
                                    </button>
                                    <button type="button" onClick={() => setReplyingId(isReplying ? null : review.id)}>Responder</button>
                                    {Number(review.Usuario?.id) === Number(currentUser?.id) && <button type="button" onClick={() => setReviewToDelete(review.id)} disabled={deletingReviewId === review.id}>Eliminar mi reseña</button>}
                                    {String(currentUser?.rol || "").toLowerCase() === "admin" && <button type="button" onClick={() => setModalResenaId(review.id)}>Eliminar</button>}
                                </div>
                                {isReplying && <form className="respuesta-form" onSubmit={(event) => handleReplySubmit(event, review.id)}>
                                    <textarea value={replyDrafts[review.id] || ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [review.id]: event.target.value }))} maxLength={2000} rows={2} placeholder="Escribir respuesta..." autoFocus />
                                    <button type="submit" disabled={!replyDrafts[review.id]?.trim() || replySubmittingId === review.id}><Send size={16} /> Publicar</button>
                                </form>}
                                <div className="respuestas-lista">
                                    {(review.Respuestas || []).map((reply) => {
                                        const replyAuthor = reply.Usuario || {};
                                        const replyName = replyAuthor.usuario || "Usuario";
                                        return <div className="respuesta" key={reply.id}>
                                            <img src={getAvatarSrc(replyAuthor)} alt={replyName} />
                                            <div><div className="comentario-cabecera"><strong>{replyName}</strong><small>{formatRelativeDate(reply.fecha)}</small></div><p>{reply.comentario}</p></div>
                                        </div>;
                                    })}
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
            {modalResenaId && <div className="admin-modal-overlay">
                <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="delete-review-title">
                    <button type="button" className="admin-modal-close" onClick={() => setModalResenaId(null)} aria-label="Cerrar"><X size={18} /></button>
                    <h4 id="delete-review-title">Confirmar eliminación de reseña</h4>
                    <p>Escribe el descargo que se enviará al autor:</p>
                    <textarea value={modalDescargo} onChange={(event) => setModalDescargo(event.target.value)} maxLength={2000} rows={5} />
                    <button className="btn-primary" type="button" onClick={confirmDeleteAsAdmin} disabled={modalLoading}>{modalLoading ? "Procesando..." : "Confirmar y suspender"}</button>
                </div>
            </div>}
            {reviewToDelete && <div className="admin-modal-overlay">
                <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="delete-own-review-title">
                    <button type="button" className="admin-modal-close" onClick={() => setReviewToDelete(null)} aria-label="Cerrar"><X size={18} /></button>
                    <h4 id="delete-own-review-title">¿Eliminar tu reseña?</h4>
                    <p>Esta acción eliminará también sus respuestas y likes. No se puede deshacer.</p>
                    <div className="review-delete-actions">
                        <button type="button" className="btn-outline" onClick={() => setReviewToDelete(null)} disabled={deletingReviewId === reviewToDelete}>Cancelar</button>
                        <button type="button" className="btn-primary" onClick={handleDeleteOwnReview} disabled={deletingReviewId === reviewToDelete}>
                            {deletingReviewId === reviewToDelete ? "Eliminando..." : "Eliminar definitivamente"}
                        </button>
                    </div>
                </div>
            </div>}
        </div>
    );
}
