import { useNavigate } from "react-router-dom";

export const GUEST_PROMPT_EVENT = "nextread:guest-prompt";

/** Asks the header to open the guest account prompt on the current page. */
export function open_guest_prompt() {
    window.dispatchEvent(new CustomEvent(GUEST_PROMPT_EVENT));
}

export default function RestrictionPopover({ onNavigate }) {
    const navigate = useNavigate();

    const go_to_access = (fromRegistration) => {
        if (fromRegistration) {
            sessionStorage.setItem("justReturnedFromRegistration", "true");
        }
        onNavigate?.();
        navigate("/acceso");
    };

    return (
        <div className="guest-prompt" role="dialog" aria-labelledby="guest-prompt-title">
            <p id="guest-prompt-title" className="guest-prompt-title">
                Necesitás una cuenta
            </p>
            <p className="guest-prompt-text">
                Registrate para guardar listas, puntuar libros y recibir notificaciones.
            </p>
            <div className="guest-prompt-actions">
                <button
                    type="button"
                    className="guest-prompt-primary"
                    onClick={() => go_to_access(false)}
                >
                    Iniciar sesión
                </button>
                <button
                    type="button"
                    className="guest-prompt-secondary"
                    onClick={() => go_to_access(true)}
                >
                    Registrate
                </button>
            </div>
        </div>
    );
}
