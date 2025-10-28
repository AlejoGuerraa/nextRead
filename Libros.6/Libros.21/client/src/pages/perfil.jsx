// Perfil.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; 
// 🚨 Importación corregida o comentada hasta que encuentres la ruta exacta:
// import '../pagescss/invitados.css'; 
import icono from '../assets/libroIcono.png'; 

const Perfil = () => {
  const navigate = useNavigate();
  
  const userString = localStorage.getItem('user');
  let user = null;
  if (userString) {
      try {
          user = JSON.parse(userString);
      } catch (e) {
          console.error("Error parseando JSON de usuario:", e);
      }
  }

  // Función para cerrar sesión
  const handleLogout = () => {
      localStorage.removeItem('user'); 
      navigate('/loguearse'); 
  };

  // La validación ahora funciona porque Loguearse.jsx añade el 'correo'
  if (!user || !user.correo) { 
    return (
        <div className="guest-page" style={{ textAlign: 'center', padding: '50px' }}>
            <p>No hay datos de usuario válidos. Por favor, <a href="/loguearse">inicia sesión</a>.</p>
            <button 
                onClick={() => navigate('/loguearse')}
                style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#0a6fb4', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
                Ir a Loguearse
            </button>
        </div>
    );
  }
  
  // Formatear la fecha
  const formattedDate = user.fecha_nacimiento 
    ? new Date(user.fecha_nacimiento).toLocaleDateString('es-AR') 
    : 'No especificada';


  return (
    <div className="guest-page"> 
        <header className="main-header">
            <div className="header-left">
                <img id="imagenLogo" src={icono} alt="Icono" className="logo-icon"/>
                <span className="app-title">Mi Perfil - NextRead</span>
            </div>
            <div className="header-right">
                <button className="btn-cerrar-sesion" onClick={handleLogout}>
                    Cerrar Sesión
                </button>
            </div>
        </header>

        <main className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar-wrapper">
                        {/* Muestra el icono guardado o un genérico */}
                        <div className="profile-avatar">{user.icono || '👤'}</div> 
                    </div>
                    {/* Muestra Nombre y Apellido (si existen en localStorage) */}
                    <h1 className="profile-name">{user.nombre || 'Usuario'} {user.apellido || 'Registrado'}</h1>
                    {/* Muestra el username (si existe en localStorage) */}
                    <p className="profile-username">@{user.usuario || 'Sin nombre de usuario'}</p>
                </div>

                <section className="profile-details">
                    <h2>Información de Cuenta</h2>
                    <p><strong>Correo:</strong> {user.correo}</p>
                    <p><strong>Fecha de nacimiento:</strong> {formattedDate}</p>
                    <p><strong>Descripción:</strong> {user.descripcion || 'Sin descripción.'}</p>
                </section>
                
                <button 
                    style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#0a6fb4', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    onClick={() => alert('¡Pronto podrás editar tu perfil!')}
                >
                    Editar Perfil
                </button>

            </div>
        </main>
        
        {/* Estilos mínimos para que se vea decente (puedes borrarlos si tu CSS funciona) */}
        <style>
            {`
            .profile-container {
                display: flex;
                justify-content: center;
                padding: 40px 20px;
                background-color: #f4f7f6;
                min-height: 90vh;
            }
            .profile-card {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                padding: 40px;
                width: 100%;
                max-width: 600px;
                text-align: center;
            }
            .profile-header {
                padding-bottom: 20px;
                margin-bottom: 20px;
            }
            .profile-avatar-wrapper {
                display: flex;
                justify-content: center;
                margin-bottom: 15px;
            }
            .profile-avatar {
                font-size: 80px;
                background-color: #e6f0ff;
                border-radius: 50%;
                width: 120px;
                height: 120px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 4px solid #0a6fb4;
                overflow: hidden;
            }
            .profile-name { margin: 5px 0 0; font-size: 2em; color: #333; }
            .profile-username { color: #777; font-size: 1.1em; }
            .profile-details { text-align: left; margin-top: 20px; }
            .profile-details h2 { color: #0a6fb4; border-bottom: 2px solid #0a6fb4; padding-bottom: 5px; margin-bottom: 15px; font-size: 1.5em; }
            .profile-details p { margin: 8px 0; font-size: 1.05em; line-height: 1.5; }
            .btn-cerrar-sesion {
                padding: 8px 15px;
                border-radius: 5px;
                border: none;
                background-color: #e74c3c;
                color: white;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .main-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 30px;
                background-color: #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .header-left { display: flex; align-items: center; gap: 10px; }
            .logo-icon { width: 30px; height: 30px; }
            .app-title { font-size: 1.5em; font-weight: bold; color: #0a6fb4; }
            `}
        </style>
    </div>
  );
};

export default Perfil;