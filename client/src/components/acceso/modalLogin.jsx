// src/components/acceso/modalLogin.jsx
import { Modal } from "./modal";
import React, { useState } from 'react';
import axios from "axios";
import { Eye, EyeOff } from 'lucide-react';

export const LoginModal = ({ open, close, loginForm, error, onChange, submit, openRegister }) => {
    const [isRecoveryActive, setIsRecoveryActive] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [recoveryMessage, setRecoveryMessage] = useState('');
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

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

    // ---------------------------------
    // RECOVERY FORM
    // ---------------------------------
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

    // ---------------------------------
    // LOGIN FORM
    // ---------------------------------
    const LoginForm = (
        <form className="login-content" onSubmit={submit}>
            <h2>Vuelve con nosotros ¡Logueate!</h2>

            {/* EMAIL - MISMO LARGO */}
            <div style={{ width: "100%", marginBottom: 12 }}>
                <input
                    type="email"
                    name="correo"
                    placeholder="Email"
                    value={loginForm.correo}
                    onChange={onChange}
                    style={{ width: '100%', padding: '12px', fontSize: 16 }}
                />
            </div>

            {/* CONTRASEÑA - MISMO LARGO */}
            <div style={{ width: "100%", position: 'relative', marginBottom: 12 }}>
                <input
                    type={!showPass ? "password" : "text"}
                    name="contrasena"
                    placeholder="Contraseña"
                    value={loginForm.contrasena}
                    onChange={onChange}
                    style={{ width: '100%', padding: '12px', fontSize: 16, paddingRight: 44 }}
                />
                <span 
                    onClick={() => setShowPass(!showPass)}
                    style={{ 
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        color: '#666'
                    }}
                >
                    {!showPass ? <Eye size={18} /> : <EyeOff size={18} />}
                </span>
            </div>

            {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px 0' }}>
                Iniciar Sesión
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, alignItems: 'flex-start' }}>
                <span 
                    className="redirect-link" 
                    onClick={handleOpenRecovery}
                    style={{ cursor: 'pointer', color: '#406882', textDecoration: 'underline' }}
                >
                    ¿Olvidaste tu contraseña?
                </span>

                <span 
                    className="redirect-link" 
                    onClick={openRegister}
                    style={{ cursor: 'pointer', color: '#406882', textDecoration: 'underline' }}
                >
                    ¿No tenés cuenta? Regístrate
                </span>
            </div>
        </form>
    );

    return (
        <Modal openModal={open} closeModal={close}>
            {isRecoveryActive ? RecoveryForm : LoginForm}
        </Modal>
    );
};
