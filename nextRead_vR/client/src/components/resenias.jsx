import React from "react";

export default function Resenas() {
    const comentarios = [
        { usuario: "UsuarioDemo", texto: "Amee el libro, me encantó cada parte de la historia...", estrellas: "★★★★☆" },
        { usuario: "BookLover92", texto: "Lo volvería a leer mil veces, super recomendable.", estrellas: "★★★★★" }
    ];

    return (
        <div className="comentarios-section">
            <h3>Comentarios</h3>
            {comentarios.map((c, i) => (
                <div className="comentario" key={i}>
                    <div className="comentario-avatar">👤</div>
                    <div className="comentario-contenido">
                        <p className="comentario-usuario">{c.usuario}</p>
                        <p className="comentario-texto">{c.texto}</p>
                        <div className="comentario-estrellas">{c.estrellas}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}