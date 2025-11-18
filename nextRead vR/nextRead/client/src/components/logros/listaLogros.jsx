import React from "react";
import CardLogro from "./cardLogro";

const ListaLogros = ({ logros }) => {
    if (!logros || !logros.length) {
        return <div className="empty-list">Aún no tienes logros</div>;
    }

    return (
        <div className="list-block">
            <div className="list-header">
                <h4>Tus logros</h4>
                <span className="list-meta">{logros.length} logros</span>
            </div>
            <div className="books-row hide-scrollbar">
                {logros.map((l, i) => (
                    <CardLogro key={i} logro={l} />
                ))}
            </div>
            <p className="muted-small">
                Nota: la lista está en modo placeholder. Cuando tengas la ruta del backend
                la conectamos para traer los logros por usuario (usuario_logro).
            </p>
        </div>
    );
};

export default ListaLogros;
