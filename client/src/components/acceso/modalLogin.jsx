// src/components/acceso/modalLogin.jsx
import { Modal } from "./modal";
import React, { useState } from 'react';
import axios from "axios";

export const LoginModal = ({ open, close, loginForm, error, onChange, submit, openRegister }) => {
    const [isRecoveryActive, setIsRecoveryActive] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [recoveryMessage, setRecoveryMessage] = useState('');
    const [recoveryLoading, setRecoveryLoading] = useState(false);

    // --- Enviar email al servidor ---
    const handleRecoverySubmit = async (e) => {
        e.preventDefault();
        
        if (!recoveryEmail || !recoveryEmail.trim()) {
            setRecoveryMessage('Error: Por favor ingresa tu correo');
            return;
        }

        setRecoveryLoading(true);

        try {
            const response = await axios.post("http://localhost:3000/api/forgot-password", {
                email: recoveryEmail
            });

            setRecoveryMessage(response.data.message);
            
            // Limpiar después de 3 segundos y volver al login
            setTimeout(() => {
                handleBackToLogin();
            }, 3000);
        } catch (err) {
            const errorMsg = err?.response?.data?.error || "No se pudo enviar el correo.";
            setRecoveryMessage("Error: " + errorMsg);
        } finally {
            setRecoveryLoading(false);
        }
    };

    const handleOpenRecovery = () => {
        setIsRecoveryActive(true);
        setRecoveryMessage('');
        setRecoveryEmail('');
        setRecoveryLoading(false);
    };

    const handleBackToLogin = () => {
        setIsRecoveryActive(false);
        setRecoveryMessage('');
        setRecoveryEmail('');
        setRecoveryLoading(false);
    };

    const RecoveryForm = (
        <form className="login-content" onSubmit={handleRecoverySubmit}>
            <h2>Recuperar Contraseña</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
            </p>

            <input
                type="email"
                placeholder="Tu correo"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                required
            />

            {recoveryMessage && (
                <p style={{ 
                    color: recoveryMessage.startsWith('Error') ? "#c00" : "#060",
                    marginTop: "10px",
                    fontSize: "14px"
                }}>
                    {recoveryMessage}
                </p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button 
                    type="button" 
                    onClick={handleBackToLogin}
                    style={{ flex: 1, backgroundColor: '#999' }}
                >
                    ← Volver
                </button>
                <button 
                    type="submit"
                    disabled={recoveryLoading}
                    style={{ flex: 1, opacity: recoveryLoading ? 0.6 : 1, cursor: recoveryLoading ? 'not-allowed' : 'pointer' }}
                >
                    {recoveryLoading ? 'Enviando...' : 'Enviar Enlace'}
                </button>
            </div>
        </form>
    );

    const LoginForm = (
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

            <span className="redirect-link" onClick={handleOpenRecovery} style={{ cursor: 'pointer', color: '#406882', textDecoration: 'underline' }}>
                ¿Olvidaste tu contraseña?
            </span>

            <span className="redirect-link" onClick={openRegister}>
                ¿No tenés cuenta? Regístrate
            </span>
        </form>
    );

    return (
        <Modal openModal={open} closeModal={close}>
            {isRecoveryActive ? RecoveryForm : LoginForm}
        </Modal>
    );
};
