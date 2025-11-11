// InfoLibro.jsx
import React, { useState } from "react";

export default function InfoLibro({ libro }) {
    const { titulo, Autor, portada, generos, anio, tipo, descripcion, ranking } = libro;
    const autorNombre = Autor?.nombre || "Autor Desconocido";

    const [userRating, setUserRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    const handleFeatureClick = () => alert("¡Pronto podrás acceder a las funcionalidades!");
    const handleStarClick = (rating) => {
        setUserRating(rating);
        alert(`Le diste ${rating} estrellas a este libro ⭐`);
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

                <div className="libro-acciones">
                    <button className="btn secundario" onClick={handleFeatureClick}>🕮 En lectura</button>
                    <button className="btn secundario" onClick={handleFeatureClick}>♡ Favorito</button>
                    <button className="btn secundario" onClick={handleFeatureClick}>⏱︎ Para leer</button>
                    <button className="btn secundario" onClick={handleFeatureClick}>➕ Añadir a lista</button>
                </div>

                {/* ⭐ Ranking global del libro */}
                <div className="libro-ranking-global">
                    <strong>Valoración global:</strong> {ranking || 0} / 5
                </div>

                {/* ⭐ Estrellas para que el usuario valore */}
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
