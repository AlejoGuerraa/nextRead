import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import "../pagescss/resetPassword.css";
import Header from "../components/header";
import Footer from "../components/footer";

export default function ResetPassword() {
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Obtener token de la URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get("token");

        if (!t) {
                setMessage("error");
        } else {
            setToken(t);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            setMessage("Token no encontrado en la URL.");
            return;
        }

        if (newPassword.trim().length < 6) {
                setMessage("La contraseña debe tener al menos 8 caracteres y una mayúscula.");
            return;
        }

        if (newPassword !== confirm) {
                setMessage("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post("http://localhost:3000/api/reset-password", {
                token,
                newPassword
            });

                setMessage("success");
                setTimeout(() => {
                    window.location.href = "/acceso";
                }, 2000);
        } catch (err) {
                setMessage("error");
        }

        setLoading(false);
    };

    return (
        <div className="reset-password-page">
            <Header />
            <main className="reset-password-container">
                <div className="reset-card">
                    <h2>Restablecer Contraseña</h2>
          
                    {message === "error" ? (
                        <div className="error-message">
                            <p>❌ Token inválido o expirado</p>
                            <p style={{ fontSize: "14px", color: "#666" }}>El enlace ha vencido. Solicita uno nuevo.</p>
                            <a href="/acceso" className="btn-back">Volver al login</a>
                        </div>
                    ) : message === "success" ? (
                        <div className="success-message">
                            <p>✅ Contraseña actualizada correctamente</p>
                            <p style={{ fontSize: "14px", color: "#666" }}>Serás redirigido al login en 2 segundos...</p>
                        </div>
                    ) : !token ? (
                        <div className="error-message">
                            <p>❌ Token no encontrado</p>
                            <p style={{ fontSize: "14px", color: "#666" }}>Verifica que hayas usado el enlace completo del correo.</p>
                            <a href="/acceso" className="btn-back">Volver al login</a>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="reset-form">
                            <div className="form-group">
                                <label>Nueva contraseña</label>
                                <input
                                    type="password"
                                    placeholder="Mínimo 8 caracteres y una mayúscula"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Confirmar contraseña</label>
                                <input
                                    type="password"
                                    placeholder="Repite la contraseña"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    required
                                />
                            </div>
                            {message && <p className="error-text">{message}</p>}

                            <button type="submit" disabled={loading} className="btn-submit">
                                {loading ? "Guardando..." : "Guardar nueva contraseña"}
                            </button>
                        </form>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
