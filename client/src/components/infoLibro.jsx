// InfoLibro.jsx
import React, { useEffect, useState } from "react";
import { useToast } from './ToastProvider';
import { useParams } from "react-router-dom";
import api from '../services/api';
import { saveBookRating } from '../services/booksService';
import { Bookmark, Heart, Clock, PlusCircle, Book } from "lucide-react"; // iconos más lindos

const isBookInList = (books, bookId) => Array.isArray(books) && books.some((book) => {
    const id = typeof book === "object" && book !== null
        ? book.id ?? book.id_libro ?? book.book_id
        : book;
    return Number(id) === Number(bookId);
});

const isBookInCustomList = (lists, bookId) => Object.values(lists || {}).some((list) => {
    const books = Array.isArray(list) ? list : list?.libros;
    return isBookInList(books, bookId);
});

export default function InfoLibro({ libro, onRestrictedAction, actionRef, onOpenChooseList, onMarkedAsRead, userRating: selectedRating, onRatingChange, userBookLists }) {
    const { id } = useParams();
    const { titulo, Autor, portada, generos, anio, tipo, descripcion, ranking } = libro;
    const autorNombre = Autor?.nombre || "Autor Desconocido";

    const [userRating, setUserRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [actionStates, setActionStates] = useState({ enLectura: false, favoritos: false, paraLeer: false, lista: false, leido: false });
    const displayedRating = selectedRating ?? userRating;
    const toast = useToast();

    const API_BASE = "/nextread";

    useEffect(() => {
        setActionStates({
            enLectura: isBookInList(userBookLists?.libros_en_lectura, id),
            favoritos: isBookInList(userBookLists?.libros_favoritos, id),
            paraLeer: isBookInList(userBookLists?.libros_para_leer, id),
            lista: isBookInCustomList(userBookLists?.listas, id),
            leido: isBookInList(userBookLists?.libros_leidos, id),
        });
    }, [id, userBookLists]);

    const validarToken = () => {
        const token = localStorage.getItem("token");
        const userData = JSON.parse(localStorage.getItem("user"));
        const userId = userData?.id;

        if (!token || !userId) {
            if (onRestrictedAction) onRestrictedAction();
            return null;
        }

        return { token, userId };
    };

    const handleAddToList = async (tipoLista) => {
        const auth = validarToken();
        if (!auth) return;

        try {
            const response = await api.post(
                `${API_BASE}/usuario/${tipoLista}/${id}`,
                {},
                { headers: { Authorization: `Bearer ${auth.token}` } }
            );

            if (tipoLista === "favoritos") {
                setActionStates((current) => ({ ...current, favoritos: true }));
            } else {
                setActionStates((current) => ({
                    ...current,
                    enLectura: tipoLista === "enLectura",
                    paraLeer: tipoLista === "paraLeer",
                    leido: tipoLista === "leido",
                }));
            }

            toast?.push(response.data.message || 'Libro actualizado', 'success');
            if (tipoLista === "leido") onMarkedAsRead?.();
        } catch (error) {
            console.error("Error al agregar libro:", error);
            toast?.push(error.response?.data?.message || "Error al agregar el libro a la lista.", 'error');
        }
    };

    const handleStarClick = async (rating) => {
        setUserRating(rating);
        onRatingChange?.(rating);
        const auth = validarToken();
        if (!auth) return;

        try {
            const response = await saveBookRating(id, rating);
            toast?.push(response.message || `Le diste ${rating} estrellas ⭐`, 'success');
        } catch (error) {
            console.error("❌ ERROR EN rating:", error);
        }
    };

    return (
        <div className="libro-card">
            <div className="libro-portada">
                {portada ? <img src={portada} alt={titulo} /> : <div className="portada-placeholder">Portada del libro</div>}
            </div>

            <div className="libro-info">
                <h2 className="libro-titulo">{titulo}</h2>
                <p className="libro-autor">{autorNombre}</p>

                <div className="libro-meta">
                    <span><strong>Género:</strong> {generos.join(", ") || "—"}</span>
                    <span><strong>Año:</strong> {anio || "—"}</span>
                    <span><strong>Tipo:</strong> {tipo || "—"}</span>
                </div>

                <p className="libro-descripcion">{descripcion || "Sin descripción disponible."}</p>

                <div className="libro-acciones" ref={actionRef}>
                    <button className={`libro-action libro-action--reading${actionStates.enLectura ? " is-selected" : ""}`} type="button" title="En lectura" aria-label="En lectura" aria-pressed={actionStates.enLectura} onClick={() => handleAddToList("enLectura")}><Book size={21} fill={actionStates.enLectura ? "currentColor" : "none"} aria-hidden="true" /></button>
                    <button className={`libro-action libro-action--favorite${actionStates.favoritos ? " is-selected" : ""}`} type="button" title="Favorito" aria-label="Favorito" aria-pressed={actionStates.favoritos} onClick={() => handleAddToList("favoritos")}><Heart size={21} fill={actionStates.favoritos ? "currentColor" : "none"} aria-hidden="true" /></button>
                    <button className={`libro-action libro-action--later${actionStates.paraLeer ? " is-selected" : ""}`} type="button" title="Para leer" aria-label="Para leer" aria-pressed={actionStates.paraLeer} onClick={() => handleAddToList("paraLeer")}><Clock size={21} fill={actionStates.paraLeer ? "currentColor" : "none"} aria-hidden="true" /></button>
                    <button className={`libro-action libro-action--list${actionStates.lista ? " is-selected" : ""}`} type="button" title="Añadir a una lista" aria-label="Añadir a una lista" aria-pressed={actionStates.lista} onClick={() => { if (onOpenChooseList) onOpenChooseList(); else handleAddToList("lista"); }}><PlusCircle size={21} fill={actionStates.lista ? "currentColor" : "none"} aria-hidden="true" /></button>
                    <button className={`libro-action libro-action--read${actionStates.leido ? " is-selected" : ""}`} type="button" title="Leído" aria-label="Leído" aria-pressed={actionStates.leido} onClick={() => handleAddToList("leido")}><Bookmark size={21} fill={actionStates.leido ? "currentColor" : "none"} aria-hidden="true" /></button>
                </div>

                <div className="libro-ranking-global">
                    <strong>Valoración global:</strong> {ranking || 0} / 5
                </div>

                <div className="valora-libro">
                    <p style={{ marginBottom: "6px", fontWeight: "500" }}>Valora este libro:</p>
                    <div className="libro-rating">
                        {Array.from({ length: 5 }, (_, i) => {
                            const ratingValue = i + 1;
                            return (
                                <span
                                    key={ratingValue}
                                    className={`estrella ${ratingValue <= (hoverRating || displayedRating) ? "activa" : ""}`}
                                    onClick={() => handleStarClick(ratingValue)}
                                    onMouseEnter={() => setHoverRating(ratingValue)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    style={{
                                        fontSize: "24px",
                                        color: ratingValue <= (hoverRating || displayedRating) ? "#ffb400" : "#555",
                                        marginRight: "4px",
                                        cursor: "pointer"
                                    }}
                                >
                                    ★
                                </span>
                            );
                        })}
                        <span className="rating-numero" style={{ marginLeft: "8px", color: "#406882" }}>
                            ({displayedRating || 0})
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
