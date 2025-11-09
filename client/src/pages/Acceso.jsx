import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import icono from '../assets/libroIcono.png';
import { Modal } from '../components/modal';
import { ModalGustos } from '../components/modalGustos';
import '../pagescss/loguearse_registrarse.css';

import CatalogoIcon from '../assets/1LogoAcceso.png';
import ComunidadIcon from '../assets/2LogoAcceso.png';
import DiarioIcon from '../assets/3LogoAcceso.png';

const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <img src={icon} alt="" className='feature-icon' />
    <h4 className="feature-title">{title}</h4>
    <p className="feature-description">{description}</p>
  </div>
);

export default function Acceso() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  /* Estados modales */
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  /* Login */
  const [loginForm, setLoginForm] = useState({ correo: '', contrasena: '' });
  const [loginError, setLoginError] = useState('');

  /* Registro */
  const [registerStep, setRegisterStep] = useState(1);
  const [registerErrors, setRegisterErrors] = useState({});
  const [registerForm, setRegisterForm] = useState({
    correo: '',
    contrasena: '',
    repeatPassword: '',
    nombre: '',
    apellido: '',
    usuario: '',
    nacimiento: '',
    descripcion: '',
    avatar: '≽^• ˕ • ྀི≼',
  });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const avatarOptions = ['🧸ྀི', '♡', '₍^. .^₎⟆', '≽^-⩊-^≼', 'ᓚ₍⑅^..^₎♡', '🐔'];
  const [showGustos, setShowGustos] = useState(false);

  useEffect(() => {
    const modalParam = params.get('modal');
    if (modalParam === 'login') setLoginOpen(true);
    else if (modalParam === 'register') setRegisterOpen(true);
  }, [location.search]);

  /* ---------------------- LOGIN ---------------------- */
  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    setLoginError('');
  };

  const handleLoginSubmit = async () => {
    if (!loginForm.correo || !loginForm.contrasena) {
      setLoginError('Por favor complete todos los campos.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/nextread/login', loginForm);
      const userData = { ...response.data, correo: loginForm.correo };
      localStorage.setItem('user', JSON.stringify(userData));
      setLoginOpen(false);
      navigate('/logueado');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al iniciar sesión. Verifique sus credenciales.';
      setLoginError(errorMessage);
    }
  };

  /* ---------------------- REGISTRO ---------------------- */
  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
    if (registerErrors[e.target.name]) {
      setRegisterErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!registerForm.correo) newErrors.correo = 'El correo es obligatorio.';
    else if (!emailRegex.test(registerForm.correo)) newErrors.correo = 'Formato de correo inválido.';

    if (!registerForm.contrasena) newErrors.contrasena = 'La contraseña es obligatoria.';
    else if (!passwordRegex.test(registerForm.contrasena))
      newErrors.contrasena = 'Debe tener 8+ caracteres, 1 mayúscula y 1 número.';

    if (!registerForm.repeatPassword) newErrors.repeatPassword = 'Debe repetir la contraseña.';
    else if (registerForm.contrasena !== registerForm.repeatPassword)
      newErrors.repeatPassword = 'Las contraseñas no coinciden.';

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!registerForm.nombre) newErrors.nombre = 'El nombre es obligatorio.';
    if (!registerForm.apellido) newErrors.apellido = 'El apellido es obligatorio.';
    if (!registerForm.usuario) newErrors.usuario = 'El nombre de usuario es obligatorio.';
    if (!registerForm.nacimiento) newErrors.nacimiento = 'La fecha de nacimiento es obligatoria.';
    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextRegisterStep = () => {
    let isValid = registerStep === 1 ? validateStep1() : validateStep2();
    if (isValid) setRegisterStep(s => Math.min(3, s + 1));
  };

  const prevRegisterStep = () => setRegisterStep(s => Math.max(1, s - 1));

  const handleFinishGustos = async (libros, generos, autores) => {
    try {
      const response = await axios.post('http://localhost:3000/nextRead/register', {
        nombre: registerForm.nombre,
        apellido: registerForm.apellido,
        correo: registerForm.correo,
        usuario: registerForm.usuario,
        contrasena: registerForm.contrasena,
        fecha_nacimiento: registerForm.nacimiento,
        icono: registerForm.avatar,
        banner: 'default-banner',
        descripcion: registerForm.descripcion,
        libros_rec: libros,
        generos_rec: generos,
        autores_rec: autores
      });

      const userData = {
        ...response.data,
        correo: registerForm.correo
      }; 
      localStorage.setItem('user', JSON.stringify(userData));
      setShowGustos(false);
      setRegisterOpen(false);
      navigate('/logueado');
    } catch (error) {
      alert('Error al registrar usuario. Revisa la consola (F12) para más detalles.');
      console.error('Error de API en registro:', error.response?.data || error);
    }
  };

  /* ---------------------- RENDER ---------------------- */
  return (
    <>
      <header className="header-simple">
        <img id="imagenLogo" src={icono} alt="Icono" />
        <h1>NextRead</h1>
      </header>

      <div className="contenedor-imagen-acceso">
        <div className="texto-superpuesto">
          <h3 className="slogan-text">Descubrí tu próxima <br /> Gran Lectura</h3>

          <button className="btn-registro-pagina" onClick={() => setRegisterOpen(true)}>Comenzar</button>

          {/* ---------- MODAL DE REGISTRO ---------- */}
          <Modal openModal={registerOpen} closeModal={() => setRegisterOpen(false)}>
            <div className="register-content">
              {registerStep === 1 && (
                <div className="step">
                  <h2>Forma parte de NextRead</h2>

                  <input type="email" name="correo" placeholder="Email" value={registerForm.correo} onChange={handleRegisterChange} className={registerErrors.correo ? 'input-error' : ''} />
                  {registerErrors.correo && <p className="error-message">{registerErrors.correo}</p>}

                  <input type="password" name="contrasena" placeholder="Contraseña" value={registerForm.contrasena} onChange={handleRegisterChange} className={registerErrors.contrasena ? 'input-error' : ''} />
                  {registerErrors.contrasena && <p className="error-message">{registerErrors.contrasena}</p>}

                  <input type="password" name="repeatPassword" placeholder="Repetir contraseña" value={registerForm.repeatPassword} onChange={handleRegisterChange} className={registerErrors.repeatPassword ? 'input-error' : ''} />
                  {registerErrors.repeatPassword && <p className="error-message">{registerErrors.repeatPassword}</p>}

                  <button className="btn-modal next-btn" onClick={nextRegisterStep}>Siguiente ➜</button>

                  <span className="redirect-link"
                    onClick={() => { setRegisterOpen(false); setLoginOpen(true); setRegisterStep(1); }}
                  >
                    ¿Ya tenés cuenta? Inicia sesión
                  </span>
                </div>
              )}

              {registerStep === 2 && (
                <div className="step">
                  <h2>Crea tu usuario</h2>

                  <input name="nombre" placeholder="Nombre" value={registerForm.nombre} onChange={handleRegisterChange} className={registerErrors.nombre ? 'input-error' : ''} />
                  {registerErrors.nombre && <p className="error-message">{registerErrors.nombre}</p>}

                  <input name="apellido" placeholder="Apellido" value={registerForm.apellido} onChange={handleRegisterChange} className={registerErrors.apellido ? 'input-error' : ''} />
                  {registerErrors.apellido && <p className="error-message">{registerErrors.apellido}</p>}

                  <input name="usuario" placeholder="UserName" value={registerForm.usuario} onChange={handleRegisterChange} className={registerErrors.usuario ? 'input-error' : ''} />
                  {registerErrors.usuario && <p className="error-message">{registerErrors.usuario}</p>}

                  <input type="date" name="nacimiento" value={registerForm.nacimiento} onChange={handleRegisterChange} className={registerErrors.nacimiento ? 'input-error' : ''} />
                  {registerErrors.nacimiento && <p className="error-message">{registerErrors.nacimiento}</p>}

                  <div className="buttons">
                    <button className="btn-modal" onClick={prevRegisterStep}>← Atrás</button>
                    <button className="btn-modal" onClick={nextRegisterStep}>Siguiente ➜</button>
                  </div>
                </div>
              )}

              {registerStep === 3 && (
                <div className="step">
                  <h2>Personaliza tu perfil</h2>

                  <div className="perfil-icono" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>{registerForm.avatar}</div>
                  <p>Click en el avatar para cambiarlo</p>

                  {showAvatarPicker && (
                    <div className="avatar-picker">
                      {avatarOptions.map((a, index) => (
                        <span key={index} className={`avatar ${registerForm.avatar === a ? 'selected' : ''}`} onClick={() => { setRegisterForm({ ...registerForm, avatar: a }); setShowAvatarPicker(false); }}>{a}</span>
                      ))}
                    </div>
                  )}

                  <textarea name="descripcion" placeholder="Contanos sobre vos..." value={registerForm.descripcion} onChange={handleRegisterChange} className={registerErrors.descripcion ? 'input-error' : ''} />
                  {registerErrors.descripcion && <p className="error-message">{registerErrors.descripcion}</p>}

                  <div className="buttons">
                    <button className="btn-modal" onClick={prevRegisterStep}>← Atrás</button>
                    {/* <button className="btn-modal" onClick={() => setShowGustos(true)}>Finalizar ✔</button> */}
                    <button
                      className="btn-modal"
                      onClick={() => {
                        setRegisterOpen(false); // Cierra el modal de registro
                        setTimeout(() => setShowGustos(true)); // Abre el de gustos
                      }}
                    >
                      Finalizar ✔
                    </button>


                  </div>
                </div>
              )}

              <div className="step-indicator">
                <span className={registerStep === 1 ? 'active' : ''}></span>
                <span className={registerStep === 2 ? 'active' : ''}></span>
                <span className={registerStep === 3 ? 'active' : ''}></span>
              </div>
            </div>
          </Modal>

          {/* Modal de gustos */}
          <ModalGustos open={showGustos} close={() => setShowGustos(false)} onFinish={handleFinishGustos} />

          {/* Modal de login */}
          <Modal openModal={loginOpen} closeModal={() => setLoginOpen(false)}>
            <div className="login-content">
              <h2>Vuelve con nosotros ¡Logueate!</h2>

              <div className="single-step">
                <input type="email" name="correo" placeholder="Email" value={loginForm.correo} onChange={handleLoginChange} />
                <input type="password" name="contrasena" placeholder="Contraseña" value={loginForm.contrasena} onChange={handleLoginChange} />
              </div>

              {loginError && <p style={{ color: 'red', margin: '10px 0', fontSize: '0.90rem' }}>{loginError}</p>}

              <button onClick={handleLoginSubmit}>Iniciar Sesión</button>

              <span
                className="redirect-link"
                onClick={() => { setLoginOpen(false); setRegisterOpen(true); setRegisterStep(1); }}
              >
                ¿No tenés cuenta? Regístrate
              </span>
            </div>
          </Modal>
        </div>
      </div>

      {/* TARJETAS ABAJO */}
      <div className="main-features-section">
        <FeatureCard
          icon={CatalogoIcon}
          title="Exploración de Catálogo"
          description="Explorá un catálogo inmenso de libros y filtrá por género, o listados personalizados." />

        <FeatureCard
          icon={ComunidadIcon}
          title="Conectá con lectores apasionantes"
          description="Descubrí perfiles, seguí a otros usuarios, compartí opiniones y sé parte de clubes de lectura." />

        <FeatureCard
          icon={DiarioIcon}
          title="Diario de Lecturas Personal"
          description="Registra tu progreso, puntuá, escribí reseñas y recomendá tus libros favoritos." />
      </div>

      <footer className="footer-acceso">
        <p>&copy; {new Date().getFullYear()} NextRead. Todos los derechos reservados.</p>
      </footer>
    </>
  );
}