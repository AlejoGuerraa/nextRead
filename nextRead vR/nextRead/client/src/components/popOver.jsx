// src/components/popOver.jsx 
import React from "react";
import { useNavigate } from "react-router-dom";
import "../pagescss/principal.css";

export default function RestrictionPopover() {
    const navigate = useNavigate();

    // Evitamos que el mousedown dentro del popover burste el listener global (defensivo)
    const handleMouseDown = (e) => {
        e.stopPropagation();
    };

    return (
        <div className="restriction-popover" onMouseDown={handleMouseDown}>
            <p style={{ margin: 0, fontWeight: 700, color: "#333" }}>
                ¡Necesitas una cuenta!
            </p>
            <p
                style={{
                    marginTop: 8,
                    marginBottom: 6,
                    color: "#555",
                    fontSize: 13,
                }}
            >
                Registrate para guardar listas, puntuar libros y recibir
                notificaciones.
            </p>

            <button
                className="popover-link"
                onClick={() => {
                    sessionStorage.setItem("justReturnedFromRegistration", "true");
                    navigate("/acceso");
                }}
            >
                Regístrate aquí
            </button>

            <button
                className="popover-link"
                style={{ marginTop: 6 }}
                onClick={() => navigate("/acceso")}
            >
                Iniciar sesión
            </button>
        </div>
    );
}
