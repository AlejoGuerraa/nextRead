import { Modal } from "./modal";
import React, { useState } from 'react';
import axios from "axios";
import { useToast } from './ToastProvider';

export const LoginModal = ({ open, close, loginForm, error, onChange, submit, openRegister }) => {
    const [isRecoveryActive, setIsRecoveryActive] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [recoveryMessage, setRecoveryMessage] = useState('');
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const toast = useToast();

    // --- Enviar email al servidor ---
    const handleRecoverySubmit = async (e) => {
        e.preventDefault();
        
        if (!recoveryEmail || !recoveryEmail.trim()) {
            toast?.push('Por favor ingresa tu correo', 'error');
            return;
        }

        setRecoveryLoading(true);
        setRecoveryMessage('');

        try {
            const response = await axios.post("http://localhost:3000/api/forgot-password", {
                email: recoveryEmail
            });

            setRecoveryMessage(response.data.message);
            toast?.push(response.data.message, 'success');
            
            // Limpiar después de 5 segundos y volver al login
            setTimeout(() => {
                handleBackToLogin();
            }, 3000);
        } catch (err) {
            const errorMsg = err?.response?.data?.error || "No se pudo enviar el correo.";
            setRecoveryMessage("Error: " + errorMsg);
            toast?.push("Error: " + errorMsg, 'error');
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
        <form className="login-content" onSubmit={handleRecoverySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2 style={{ marginBottom: '10px', textAlign: 'center' }}>Recuperar Contraseña</h2>
            <p style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
            </p>

            <input
                type="email"
                placeholder="Tu correo"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                required
                style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid #ddd', 
                    borderRadius: '6px',
                    fontSize: '14px'
                }}
            />

            {recoveryMessage && (
                <div style={{ 
                    padding: '12px', 
                    borderRadius: '6px',
                    backgroundColor: recoveryMessage.startsWith('Error') ? '#fee' : '#efe',
                    color: recoveryMessage.startsWith('Error') ? '#c00' : '#060',
                    fontSize: '14px',
                    textAlign: 'center'
                }}>
                    {recoveryMessage}
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                    type="button" 
                    onClick={handleBackToLogin}
                    style={{ 
                        flex: 1, 
                        padding: '10px', 
                        backgroundColor: '#999', 
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    ← Volver
                </button>
                <button 
                    type="submit"
                    disabled={recoveryLoading}
                    style={{ 
                        flex: 1, 
                        padding: '10px', 
                        backgroundColor: recoveryLoading ? '#ccc' : '#406882', 
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: recoveryLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    {recoveryLoading ? 'Enviando...' : 'Enviar Enlace'}
                </button>
            </div>
        </form>
    );

    const LoginForm = (
        <form className="login-content" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ marginBottom: '10px', textAlign: 'center' }}>Iniciar Sesión</h2>

            <input 
                type="email" 
                name="correo" 
                placeholder="Email" 
                value={loginForm.correo} 
                onChange={onChange}
                style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                }}
            />
            <input 
                type="password" 
                name="contrasena" 
                placeholder="Contraseña" 
                value={loginForm.contrasena} 
                onChange={onChange}
                style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                }}
            />

            {error && (
                <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#fee', 
                    color: '#c00',
                    borderRadius: '6px',
                    fontSize: '14px',
                    textAlign: 'center'
                }}>
                    {error}
                </div>
            )}

            <button 
                type="submit"
                style={{
                    padding: '12px',
                    backgroundColor: '#406882',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '5px'
                }}
            >
                Iniciar Sesión
            </button>

            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px',
                marginTop: '10px',
                textAlign: 'center'
            }}>
                <span 
                    onClick={handleOpenRecovery} 
                    style={{ 
                        cursor: 'pointer', 
                        color: '#406882',
                        fontSize: '14px',
                        textDecoration: 'underline'
                    }}
                >
                    ¿Olvidaste tu contraseña?
                </span>

                <span 
                    onClick={openRegister}
                    style={{
                        cursor: 'pointer',
                        color: '#406882',
                        fontSize: '14px',
                        textDecoration: 'underline'
                    }}
                >
                    ¿No tenés cuenta? Registrate
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
