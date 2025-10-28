// loguearse.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import icono from '../assets/libroIcono.png';
import { Modal } from '../components/modal';
import '../pagescss/loguearse_registrarse.css';

const FeatureCard = ({ icon, titulo, descripcion }) => (
  <div className="feature-card">
    <div className="feature-icon-text">{icon}</div>
    <h4 className="feature-title">{titulo}</h4>
    <p className="feature-description">{descripcion}</p>
  </div>
);

function Loguearse() {
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();


  const [form, setForm] = useState({
    correo: '',
    contrasena: '',
  });


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };


  const handleSubmit = async () => {
    if (!form.correo || !form.contrasena) {
      setError('Por favor complete todos los campos.');
      return;
    }


    try {
      const response = await axios.post('http://localhost:3000/nextread/login', form); 
      
      // El backend solo devuelve el token, así que añadimos el correo.
      const userData = {
        ...response.data, // { token: '...' }
        correo: form.correo, // Añadimos el correo
      };
      
      localStorage.setItem('user', JSON.stringify(userData)); 

      alert('Login exitoso');
      setModal(false);
      navigate('/logueado');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al iniciar sesión. Verifique sus credenciales.';
      setError(errorMessage);
    }
  };


  return (
    <>
      <header className="header-simple">
        <img id="imagenLogo" src={icono} alt="Icono" />
        <h1>NextRead</h1>
      </header>


      <div className="contenedor-imagen-loguearse">
        {/* ... imagen ... */}


        <div className="texto-superpuesto">
          <h3>Continúa puntuando tus libros</h3>

          <button onClick={() => setModal(true)}>Loguearse</button>

          


          <Modal openModal={modal} closeModal={() => setModal(false)}>
            <div className="register-content">
              <h2>Vuelve con nosotros, logueate!</h2>


              <div className="single-step">
                <input type="email" name="correo" placeholder="Email (*)" value={form.correo} onChange={handleChange} />
                <input type="password" name="contrasena" placeholder="Contraseña (*)" value={form.contrasena} onChange={handleChange} />
              </div>


              {error && <p style={{ color: 'red', margin: '10px 0' }}>{error}</p>}


              <button onClick={handleSubmit}>Iniciar Sesión</button>


              <button
                className="register-redirect"
                onClick={() => {
                  setModal(false);
                  navigate('/registrarse');
                }}
                style={{
                  marginTop: '15px',
                  backgroundColor: 'transparent',
                  color: '#0a6fb4',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ¿No tienes cuenta? Regístrate
              </button>
            </div>
          </Modal>
        </div>
      </div>


      <div className = "main-features-section">
        <FeatureCard
          icon = "🔍" //emoji para icono de busqueda
          titulo = "Exploración de Catálogo"
          descripcion ="Explorá un catálogo inmenso de libros y filtrá por género favorito."
        />
        <FeatureCard
          icon="👥" //emoji para icono de usuarios
          titulo="Conectá con lectores apasionantes"
          descripcion="Descubrí perfiles, seguí a otros usuarios, compartí opiniones y sé parte de clubes lectura."
        />
        <FeatureCard
          icon="📚" //emoji para icono de libros
          titulo="Diario de Lecturas Personales"
          descripcion="Llevá un diario de tus lecturas, puntuá, escribí reseñas y recomendá tus libros favoritas."
        />
      </div>

      {/* --- FOOTER SIMPLE --- */}
      <footer className="footer-RL">
        <p>&copy; {new Date().getFullYear()} NextRead. Todos los derechos reservados.</p>
      </footer>
      {/* --------------------------- */}


    </>
  );
}


export default Loguearse;