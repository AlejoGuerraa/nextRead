import React from "react";

const CardLogro = ({ logro }) => {
    const isObj = logro && typeof logro === 'object' && !Array.isArray(logro);
    const id = isObj ? logro.id : logro;
    const title = isObj ? (logro.title || `Logro ${id}`) : `Logro ${id}`;
    const desc = isObj ? (logro.desc || "Descripción del logro") : "Descripción del logro";
    const icon = isObj ? logro.icon : null;

    return (
        <div className="achievement-card book-card" aria-label={`achievement-${id}`}>
            <div className="book-cover">
                {icon ? <img src={icon} alt={title} /> : <div className="book-cover-placeholder">🏆</div>}
            </div>
            <div className="book-meta">
                <span className="book-title">{title}</span>
                <span className="book-author">{desc}</span>
            </div>
            <div className="book-footer">
                <button className="btn-secondary small">Ver</button>
            </div>
        </div>
    );
};

export default CardLogro;
