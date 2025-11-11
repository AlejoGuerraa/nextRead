// src/components/acceso/modalLogin.jsx
import { Modal } from "./modal";

export const LoginModal = ({ open, close, loginForm, error, onChange, submit, openRegister }) => (
    <Modal openModal={open} closeModal={close}>
        <form className="login-content" onSubmit={submit}>
            <h2>Vuelve con nosotros ¡Logueate!</h2>

            <input
                type="email"
                name="correo"
                placeholder="Email"
                value={loginForm.correo}
                onChange={onChange}
            />

            <input
                type="password"
                name="contrasena"
                placeholder="Contraseña"
                value={loginForm.contrasena}
                onChange={onChange}
            />

            {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

            <button type="submit">Iniciar Sesión</button>

            <span className="redirect-link" onClick={openRegister}>
                ¿No tenés cuenta? Regístrate
            </span>
        </form>
    </Modal>
);
