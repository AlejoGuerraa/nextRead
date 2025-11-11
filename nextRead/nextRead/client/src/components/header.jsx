// header.jsx
import { useNavigate } from "react-router-dom";
import SearchBar from "./busqueda";

export default function Header({ user, onRestrictedAction, headerRightRef }) {
    const navigate = useNavigate();

    const handleIconClick = (target) => {
        if (user) {
            // 🔐 Usuario logueado → navega normalmente
            if (target === "notificaciones") navigate("/notificaciones");
            else if (target === "ajustes") navigate("/ajustes");
            else if (target === "amigos") navigate("/amigos");
            else if (target === "perfil") navigate("/perfil");
        } else {
            // 🚫 Invitado → muestra popover
            onRestrictedAction?.();
        }
    };

    return (
        <header className="logueado-header">
            <div className="header-left">
                <div className="logo">📚</div>
                <span className="app-title">NextRead</span>

                <div style={{ marginLeft: 12 }}>
                    <SearchBar />
                </div>
            </div>

            <div className="header-right" ref={headerRightRef}>
                <div
                    className="icon"
                    title="Notificaciones"
                    onClick={() => handleIconClick("notificaciones")}
                >
                    🔔
                </div>

                <div
                    className="icon"
                    title="Ajustes"
                    onClick={() => handleIconClick("ajustes")}
                >
                    ⚙️
                </div>

                <div
                    className="icon"
                    title="Amigos"
                    onClick={() => handleIconClick("amigos")}
                >
                    👥
                </div>

                <div
                    className="profile"
                    onClick={() => handleIconClick("perfil")}
                    title={user ? "Ir al perfil" : "Necesitas una cuenta"}
                    style={{ cursor: "pointer" }}
                >
                    <span>👤</span>
                    <span className="profile-name" style={{ marginLeft: 6 }}>
                        {user?.nombre || "Invitado"}
                    </span>
                </div>
            </div>
        </header>
    );
}
