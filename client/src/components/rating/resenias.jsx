import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, MessageCircle, Send, ShieldAlert, Trash2, X } from "lucide-react";
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
    const value = Math.round(Math.max(0, Math.min(5, Number(rating) || 0)));
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

const getProfilePath = (profileUser, currentUser) => {
    if (Number(profileUser?.id) === Number(currentUser?.id) && currentUser?.id) return "/perfil";
    return `/user/${encodeURIComponent(profileUser.usuario)}`;
};

export default function Resenas({ rating = 0, onRatingChange }) {
    const { id } = useParams();
    const toast = useToast();
    const [reviews, setReviews] = useState([]);
    const [currentUser, setCurrentUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem("user")) || {}; } catch { return {}; }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

    const fetchReviews = useCallback(async () => {
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
    }, [id]);

    useEffect(() => { if (id) fetchReviews(); }, [fetchReviews, id]);

    useEffect(() => {
        const userId = Number(currentUser?.id);
        if (!Number.isInteger(userId) || userId <= 0) return;

        const ownReview = reviews
            .filter((review) => Number(review.Usuario?.id) === userId && review.puntuacion != null)
            .sort((left, right) => new Date(right.fecha).getTime() - new Date(left.fecha).getTime())[0];
        const savedRating = Number(ownReview?.puntuacion);
        if (Number.isInteger(savedRating) && savedRating >= 1 && savedRating <= 5) {
            onRatingChange?.(savedRating);
        }
    }, [currentUser?.id, onRatingChange, reviews]);

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
            const selectedRating = Number.isInteger(Number(rating)) && Number(rating) >= 1 && Number(rating) <= 5
                ? Number(rating)
                : null;
            await createReview(id, { puntuacion: selectedRating, comentario: comment });
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
        <section className="comentarios-section" aria-labelledby="reviews-heading">
            <header className="reviews-heading">
                <div>
                    <h2 id="reviews-heading">Reseñas</h2>
                    <p>Opiniones y conversaciones de lectores</p>
                </div>
                <span className="reviews-count" aria-live="polite">
                    {loading ? "Cargando" : `${reviews.length} ${reviews.length === 1 ? "reseña" : "reseñas"}`}
                </span>
            </header>

            <form className="resena-form" onSubmit={handleSubmit} aria-label="Publicar reseña">
                <div className="review-form-heading">
                    <h3>Comparte tu opinión</h3>
                    <p>La puntuación se toma de la ficha del libro.</p>
                </div>
                <label className="review-comment-label" htmlFor="review-comment">Tu reseña</label>
                <div className="review-comment-field">
                    <textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} rows={5} minLength={1} maxLength={300} aria-describedby="review-comment-count" placeholder="¿Qué te pareció este libro?" />
                    <small id="review-comment-count" aria-live="polite">{comment.length}/300</small>
                </div>
                <button className="review-submit" type="submit" disabled={submitting} aria-busy={submitting}>
                    <Send size={16} aria-hidden="true" />
                    {submitting ? "Publicando..." : "Publicar reseña"}
                </button>
            </form>
            <div className="reviews-list-heading">
                <h3>Lo que están leyendo</h3>
            </div>
            {loading && <p className="reviews-state" role="status">Cargando reseñas...</p>}
            {error && <div className="reviews-state reviews-error" role="alert"><span>{error}</span><button type="button" onClick={fetchReviews}>Reintentar</button></div>}
            {!loading && !error && reviews.length === 0 && (
                <div className="reviews-state reviews-empty">
                    <MessageCircle size={22} aria-hidden="true" />
                    <p>Aún no hay reseñas. Puedes iniciar la conversación.</p>
                </div>
            )}
            <div className="lista-resenas">
                {reviews.map((review) => {
                    const author = review.Usuario || {};
                    const displayName = author.usuario || "Usuario";
                    const authorProfilePath = author.usuario ? getProfilePath(author, currentUser) : null;
                    const isReplying = replyingId === review.id;
                    return (
                        <article className="comentario" key={review.id}>
                            <img className="comentario-avatar" src={getAvatarSrc(author)} alt="" />
                            <div className="comentario-contenido">
                                <div className="comentario-cabecera">
                                    <strong className="comentario-usuario">
                                        {author.usuario
                                            ? <Link className="review-user-link" to={authorProfilePath}>{displayName}</Link>
                                            : displayName}
                                    </strong>
                                    <time dateTime={review.fecha}>{formatRelativeDate(review.fecha)}</time>
                                </div>
                                <div
                                    className="comentario-estrellas"
                                    role="img"
                                    aria-label={review.puntuacion == null ? "Sin valoración" : `Puntuación publicada: ${review.puntuacion} de 5 estrellas`}
                                >
                                    {review.puntuacion == null ? (
                                        <span className="review-no-rating">Sin valoración</span>
                                    ) : (
                                        <>
                                            <span aria-hidden="true">{starsFromRating(review.puntuacion)}</span>
                                            <span className="review-score-value">{review.puntuacion}/5</span>
                                        </>
                                    )}
                                </div>
                                <p className="comentario-texto">{review.comentario || "Sin comentario"}</p>
                                <div className="resena-acciones">
                                    <button type="button" onClick={() => handleLike(review)} disabled={likingIds.includes(review.id)} className={`review-action review-like${review.likedByCurrentUser ? " is-liked" : ""}`} aria-label={review.likedByCurrentUser ? "Quitar like" : "Dar like"} aria-pressed={Boolean(review.likedByCurrentUser)} aria-busy={likingIds.includes(review.id)}>
                                        <Heart size={17} fill={review.likedByCurrentUser ? "currentColor" : "none"} aria-hidden="true" /><span>{review.likes || 0}</span>
                                    </button>
                                    <button type="button" className="review-action" onClick={() => setReplyingId(isReplying ? null : review.id)} aria-expanded={isReplying}>
                                        <MessageCircle size={16} aria-hidden="true" /> Responder
                                    </button>
                                    {Number(review.Usuario?.id) === Number(currentUser?.id) && <button type="button" className="review-action review-destructive" onClick={() => setReviewToDelete(review.id)} disabled={deletingReviewId === review.id}>
                                        <Trash2 size={15} aria-hidden="true" /> Eliminar mi reseña
                                    </button>}
                                    {String(currentUser?.rol || "").toLowerCase() === "admin" && <button type="button" className="review-action review-destructive" onClick={() => setModalResenaId(review.id)} aria-label={`Eliminar reseña de ${displayName}`}>
                                        <ShieldAlert size={15} aria-hidden="true" /> Eliminar
                                    </button>}
                                </div>
                                {isReplying && <form className="respuesta-form" onSubmit={(event) => handleReplySubmit(event, review.id)} aria-busy={replySubmittingId === review.id}>
                                    <label className="visually-hidden" htmlFor={`review-reply-${review.id}`}>Responder a {displayName}</label>
                                    <textarea id={`review-reply-${review.id}`} value={replyDrafts[review.id] || ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [review.id]: event.target.value }))} maxLength={2000} rows={2} placeholder="Escribir respuesta..." autoFocus />
                                    <div className="reply-form-footer">
                                        <small aria-live="polite">{(replyDrafts[review.id] || "").length}/2000</small>
                                        <button type="submit" disabled={!replyDrafts[review.id]?.trim() || replySubmittingId === review.id}>
                                            <Send size={16} aria-hidden="true" /> {replySubmittingId === review.id ? "Publicando..." : "Publicar"}
                                        </button>
                                    </div>
                                </form>}
                                <div className="respuestas-lista">
                                    {(review.Respuestas || []).map((reply) => {
                                        const replyAuthor = reply.Usuario || {};
                                        const replyName = replyAuthor.usuario || "Usuario";
                                        const replyProfilePath = replyAuthor.usuario ? getProfilePath(replyAuthor, currentUser) : null;
                                        return <div className="respuesta" key={reply.id}>
                                            <img src={getAvatarSrc(replyAuthor)} alt="" />
                                            <div className="reply-content"><div className="comentario-cabecera"><strong>{replyAuthor.usuario ? <Link className="review-user-link" to={replyProfilePath}>{replyName}</Link> : replyName}</strong><time dateTime={reply.fecha}>{formatRelativeDate(reply.fecha)}</time></div><p>{reply.comentario}</p></div>
                                        </div>;
                                    })}
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
            {modalResenaId && <div className="admin-modal-overlay">
                <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="delete-review-title" aria-describedby="delete-review-description">
                    <button type="button" className="admin-modal-close" onClick={() => setModalResenaId(null)} aria-label="Cerrar"><X size={18} /></button>
                    <h4 id="delete-review-title">Confirmar eliminación de reseña</h4>
                    <p id="delete-review-description">Escribe el descargo que se enviará al autor:</p>
                    <textarea value={modalDescargo} onChange={(event) => setModalDescargo(event.target.value)} maxLength={200} rows={5} />
                    <div className="review-delete-actions">
                        <button className="review-modal-cancel" type="button" onClick={() => setModalResenaId(null)} disabled={modalLoading}>Cancelar</button>
                        <button className="review-modal-danger" type="button" onClick={confirmDeleteAsAdmin} disabled={modalLoading} aria-busy={modalLoading}>
                            <ShieldAlert size={16} aria-hidden="true" /> {modalLoading ? "Procesando..." : "Confirmar y suspender"}
                        </button>
                    </div>
                </div>
            </div>}
            {reviewToDelete && <div className="admin-modal-overlay">
                <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="delete-own-review-title" aria-describedby="delete-own-review-description">
                    <button type="button" className="admin-modal-close" onClick={() => setReviewToDelete(null)} aria-label="Cerrar"><X size={18} /></button>
                    <h4 id="delete-own-review-title">¿Eliminar tu reseña?</h4>
                    <p id="delete-own-review-description">Esta acción eliminará también sus respuestas y likes. No se puede deshacer.</p>
                    <div className="review-delete-actions">
                        <button type="button" className="review-modal-cancel" onClick={() => setReviewToDelete(null)} disabled={deletingReviewId === reviewToDelete}>Cancelar</button>
                        <button type="button" className="review-modal-danger" onClick={handleDeleteOwnReview} disabled={deletingReviewId === reviewToDelete} aria-busy={deletingReviewId === reviewToDelete}>
                            <Trash2 size={16} aria-hidden="true" />
                            {deletingReviewId === reviewToDelete ? "Eliminando..." : "Eliminar definitivamente"}
                        </button>
                    </div>
                </div>
            </div>}
        </section>
    );
}
