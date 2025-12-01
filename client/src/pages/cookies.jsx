// src/pages/Cookies.jsx
import React from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import "../pagescss/cookies.css";

export default function Cookies() {
    return (
        <div className="cookies-container">
            <Header />

            <main className="cookies-content">
                <h1 className="cookies-title">Política de Cookies – NextRead</h1>
                <p className="cookies-subtitle">
                    Última actualización: 2025
                </p>

                <section className="cookies-section">
                    <h2>1. ¿Qué son las cookies?</h2>
                    <p>
                        Las cookies son pequeños archivos que se almacenan en tu dispositivo
                        para recordar información sobre tu visita. En NextRead las usamos para
                        asegurar el correcto funcionamiento del sitio, mantener tu sesión 
                        iniciada y mejorar la experiencia dentro de la plataforma.
                    </p>
                </section>

                <section className="cookies-section">
                    <h2>2. ¿Qué cookies utilizamos?</h2>

                    <h3>✓ Cookies necesarias</h3>
                    <p>
                        Sin estas cookies, NextRead no puede funcionar correctamente. Son 
                        esenciales para procesos como:
                    </p>
                    <ul>
                        <li>Iniciar sesión y mantener tu sesión activa (JWT).</li>
                        <li>Verificar tu identidad de manera segura (bcrypt + JWT).</li>
                        <li>Proteger la cuenta del usuario.</li>
                    </ul>

                    <h3>✓ Cookies de funcionalidad</h3>
                    <p>
                        Son utilizadas para recordar pequeñas configuraciones dentro del sitio,
                        como tu estado de inicio de sesión y ciertas interacciones básicas.
                    </p>

                    <h3>✓ Cookies relacionadas con notificaciones por correo</h3>
                    <p>
                        En NextRead podés elegir qué correos recibir. Tu selección también se
                        almacena en tu perfil y puede incluir:
                    </p>
                    <ul>
                        <li>Recibir recomendaciones personalizadas.</li>
                        <li>Recibir un resumen semanal.</li>
                        <li>Notificaciones sociales (nuevos seguidores, comentarios, reacciones).</li>
                    </ul>
                </section>

                <section className="cookies-section">
                    <h2>3. Cookies que NO utilizamos</h2>
                    <ul>
                        <li>No utilizamos cookies de análisis (p. ej., Google Analytics).</li>
                        <li>No utilizamos cookies publicitarias.</li>
                        <li>No realizamos seguimiento entre sitios.</li>
                        <li>No compartimos información de cookies con terceros.</li>
                    </ul>
                </section>

                <section className="cookies-section">
                    <h2>4. ¿Cómo podés gestionar o borrar las cookies?</h2>
                    <p>
                        Podés desactivar o eliminar cookies desde la configuración de tu navegador. 
                        Sin embargo, si deshabilitás las cookies necesarias, ciertas funciones 
                        de NextRead podrían dejar de funcionar correctamente, incluyendo:
                    </p>
                    <ul>
                        <li>Iniciar sesión.</li>
                        <li>Mantener tu sesión activa.</li>
                        <li>Acceder a funciones protegidas del usuario.</li>
                    </ul>
                </section>

                <section className="cookies-section">
                    <h2>5. Contacto</h2>
                    <p>
                        Si tenés dudas sobre esta Política de Cookies, podés escribirnos a:
                    </p>
                    <p className="cookies-mail">
                        📩 <strong>nextreadoficial@gmail.com</strong>
                    </p>
                </section>
            </main>

            <Footer />
        </div>
    );
}
