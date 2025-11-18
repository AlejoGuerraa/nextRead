// InfoLibro.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Bookmark, Heart, Clock, PlusCircle, Book } from "lucide-react"; // iconos más lindos

export default function InfoLibro({ libro, onRestrictedAction, actionRef }) {
    const { id } = useParams();
    const { titulo, Autor, portada, generos, anio, tipo, descripcion, ranking } = libro;
    const autorNombre = Autor?.nombre || "Autor Desconocido";

    const [userRating, setUserRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    const API_BASE = "http://localhost:3000/nextread";

    const validarToken = () => {
        const userData = JSON.parse(localStorage.getItem("user"));
        const token = userData?.token;
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
            const response = await axios.post(
                `${API_BASE}/usuario/${tipoLista}/${id}`,
                {},
                { headers: { Authorization: `Bearer ${auth.token}` } }
            );
            alert(`✅ ${response.data.message}`);
        } catch (error) {
            console.error("Error al agregar libro:", error);
            alert(error.response?.data?.message || "❌ Error al agregar el libro a la lista.");
        }
    };

    const handleStarClick = async (rating) => {
        setUserRating(rating);
        const auth = validarToken();
        if (!auth) return;

        try {
            const response = await axios.post(
                `${API_BASE}/resena/${id}`,
                { puntuacion: rating },
                { headers: { Authorization: `Bearer ${auth.token}` } }
            );
            alert(response.data.message || `Le diste ${rating} estrellas ⭐`);
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
                    <button className="btn" onClick={() => handleAddToList("enLectura")}><Book /> En lectura</button>
                    <button className="btn" onClick={() => handleAddToList("favoritos")}><Heart /> Favorito</button>
                    <button className="btn" onClick={() => handleAddToList("paraLeer")}><Clock /> Para leer</button>
                    <button className="btn" onClick={() => handleAddToList("lista")}><PlusCircle /> Añadir a lista</button>
                    <button className="btn" onClick={() => handleAddToList("leido")}><Bookmark /> Leído</button>
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
                                    className={`estrella ${ratingValue <= (hoverRating || userRating) ? "activa" : ""}`}
                                    onClick={() => handleStarClick(ratingValue)}
                                    onMouseEnter={() => setHoverRating(ratingValue)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    style={{
                                        fontSize: "24px",
                                        color: ratingValue <= (hoverRating || userRating) ? "#ffb400" : "#555",
                                        marginRight: "4px",
                                        cursor: "pointer"
                                    }}
                                >
                                    ★
                                </span>
                            );
                        })}
                        <span className="rating-numero" style={{ marginLeft: "8px", color: "#406882" }}>
                            ({userRating || 0})
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}