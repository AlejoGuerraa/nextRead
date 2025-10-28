import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../pagescss/loguearse_registrarse.css';
import icono from '../assets/libroIcono.png';
import { Modal } from '../components/modal';
import { ModalGustos } from '../components/modalGustos';

// Componente Tarjeta de Característica
// NOTA: Usamos 'title' y 'description' como props para mantener la coherencia con CSS.
const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon-text">{icon}</div>
    <h4 className="feature-title">{title}</h4>
    <p className="feature-description">{description}</p>
  </div>
);


function Registrarse() {
  const [modal, setModal] = useState(false);
  const [showGustos, setShowGustos] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Estado para manejar los errores de validación
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Limpiar errores al escribir
    if (errors[e.target.name]) {
      setErrors(prevErrors => ({ ...prevErrors, [e.target.name]: null }));
    }
  };


  /* --- FUNCIONES DE VALIDACIÓN POR PASO --- */

  const validateStep1 = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!form.correo) {
      newErrors.correo = 'El correo es obligatorio.';
    } else if (!emailRegex.test(form.correo)) {
      newErrors.correo = 'Formato de correo inválido.';
    }

    if (!form.contrasena) {
      newErrors.contrasena = 'La contraseña es obligatoria.';
    } else if (!passwordRegex.test(form.contrasena)) {
      newErrors.contrasena = 'Debe tener 8+ caracteres, 1 mayúscula y 1 número.';
    }

    if (form.contrasena !== form.repeatPassword) {
      newErrors.repeatPassword = 'Las contraseñas no coinciden.';
    } else if (!form.repeatPassword) {
      newErrors.repeatPassword = 'Debe repetir la contraseña.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!form.nombre) newErrors.nombre = 'El nombre es obligatorio.';
    if (!form.apellido) newErrors.apellido = 'El apellido es obligatorio.';
    if (!form.usuario) newErrors.usuario = 'El nombre de usuario es obligatorio.';
    if (!form.nacimiento) newErrors.nacimiento = 'La fecha de nacimiento es obligatoria.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  /* --- FUNCIONES DE NAVEGACIÓN --- */

  const nextStep = () => {
    let isValid = true;

    if (step === 1) {
      isValid = validateStep1();
    } else if (step === 2) {
      isValid = validateStep2();
    }

    if (isValid) {
      setStep((s) => Math.min(3, s + 1));
    }
  };



  // Función que se ejecuta cuando ModalGustos finaliza (Llamada a la API)
  const handleFinishGustos = async (libros, generos, autores) => {
    try {
      const response = await axios.post('http://localhost:3000/nextread/register', {
        nombre: form.nombre,
        apellido: form.apellido,
        correo: form.correo,
        usuario: form.usuario,
        contrasena: form.contrasena,
        fecha_nacimiento: form.nacimiento,
        icono: form.avatar,
        banner: 'default-banner',
        descripcion: form.descripcion,
        libros_rec: libros,
        generos_rec: generos,
        autores_rec: autores
      });

      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));

      navigate('/logueado'); // NAVEGACIÓN EXITOSA
    } catch (error) {
      alert('Error al registrar usuario. Revisa la consola (F12) para más detalles del servidor.');
      console.error('Error de API en registro:', error.response?.data || error);
    }
  };

  return (
    <>
      <header className="header-simple">
        <img id="imagenLogo" src={icono} alt="Icono" />
        <h1>NextRead</h1>
      </header>

      <div className="contenedor-imagen-loguearse">

        <div className="texto-superpuesto">
          <h3 className="slogan-text">Descubrí tu próxima gran lectura</h3>

          <button className="btn-registro-pagina" onClick={() => setModal(true)}>
            Registrarse
          </button>

          <Modal openModal={modal} closeModal={() => setModal(false)}>
            <div className="register-content">

              {/* === PASO 1: CORREO Y CONTRASEÑA === */}
              {step === 1 && (
                <div className="step">
                  <h2>Forma parte de NextRead</h2>

                  {/* CAMPO CORREO */}
                  <input
                    type="email"
                    name="correo"
                    placeholder="Email"
                    value={form.correo}
                    onChange={handleChange}
                    className={errors.correo ? 'input-error' : ''}
                  />

                  <div className="error-placeholder">
                    {errors.correo && <p className="error-message">{errors.correo}</p>}
                  </div>


                  {/* CAMPO CONTRASEÑA */}
                  <input
                    type="password"
                    name="contrasena"
                    placeholder="Contraseña"
                    value={form.contrasena}
                    onChange={handleChange}
                    className={errors.contrasena ? 'input-error' : ''}
                  />

                  <div className="error-placeholder">
                    {errors.contrasena && <p className="error-message">{errors.contrasena}</p>}
                  </div>


                  {/* CAMPO REPETIR CONTRASEÑA */}
                  <input
                    type="password"
                    name="repeatPassword"
                    placeholder="Repetir contraseña"
                    value={form.repeatPassword}
                    onChange={handleChange}
                    className={errors.repeatPassword ? 'input-error' : ''}
                  />

                  <div className="error-placeholder">
                    {errors.repeatPassword && <p className="error-message">{errors.repeatPassword}</p>}
                  </div>


                  <div className="checkboxes">
                    <label className="checkbox-item">
                      <input type="checkbox" />
                      <span>Acepto los <a href="#" className="link">términos y condiciones</a></span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" />
                      <span>Acepto las <a href="#" className="link">otras políticas</a></span>
                    </label>
                  </div>

                  <div className="error-placeholder" style={{ minHeight: '15px', marginTop: '-10px' }}>
                    {errors.checkboxes && <p className="error-message error-checkbox">{errors.checkboxes}</p>}
                  </div>

                  
                  <button className="btn-modal next-btn" onClick={nextStep}>Siguiente ➜</button>
                  <button
                    className="login-redirect"
                    onClick={() => {
                      setModal(false);
                      navigate('/loguearse');
                    }}
                    style={{
                      marginTop: '5px',
                      backgroundColor: 'transparent',
                      color: '#0a6fb4',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    ¿Ya tenés cuenta? Iniciá sesión
                  </button>
                </div>
              )}

              {/* === PASO 2: DATOS PERSONALES === */}
              {step === 2 && (
                <div className="step">
                  <h2>Crea tu usuario</h2>
                  <input
                    name="nombre"
                    placeholder="Nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className={errors.nombre ? 'input-error' : ''}
                  />
                  <div className="error-placeholder">
                    {errors.nombre && <p className="error-message">{errors.nombre}</p>}
                  </div>


                  <input
                    name="apellido"
                    placeholder="Apellido"
                    value={form.apellido}
                    onChange={handleChange}
                    className={errors.apellido ? 'input-error' : ''}
                  />

                  <div className="error-placeholder">
                    {errors.apellido && <p className="error-message">{errors.apellido}</p>}
                  </div>


                  <input
                    name="usuario"
                    placeholder="UserName"
                    value={form.usuario}
                    onChange={handleChange}
                    className={errors.usuario ? 'input-error' : ''}
                  />
                  <div className="error-placeholder">
                    {errors.usuario && <p className="error-message">{errors.usuario}</p>}
                  </div>


                  <input
                    type="date"
                    name="nacimiento"
                    value={form.nacimiento}
                    onChange={handleChange}
                    className={errors.nacimiento ? 'input-error' : ''}
                  />
                  <div className="error-placeholder">
                    {errors.nacimiento && <p className="error-message">{errors.nacimiento}</p>}
                  </div>


                  <div className="buttons">
                    <button className="btn-modal" onClick={prevStep}>← Atrás</button>
                    <button className="btn-modal" onClick={nextStep}>Siguiente ➜</button>
                  </div>
                </div>
              )}

              {/* === PASO 3: PERFIL Y DESCRIPCIÓN === */}
              {step === 3 && (
                <div className="step">
                  <h2>Personaliza tu perfil</h2>

                  <div className="perfil-icono" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
                    {form.avatar}
                  </div>
                  <p>Click en el avatar para cambiarlo</p>

                  {showAvatarPicker && (
                    <div className="avatar-picker">
                      {avatarOptions.map((a, index) => (
                        <span
                          key={index}
                          className={`avatar ${form.avatar === a ? 'selected' : ''}`}
                          onClick={() => { setForm({ ...form, avatar: a }); setShowAvatarPicker(false); }}
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}

                  <textarea
                    name="descripcion"
                    placeholder="Contanos sobre vos..."
                    value={form.descripcion}
                    onChange={handleChange}
                    className={errors.descripcion ? 'input-error' : ''}
                  />
                  {errors.descripcion && <p className="error-message">{errors.descripcion}</p>}

                  <div className="buttons">
                    <button className="btn-modal" onClick={prevStep}>← Atrás</button>
                    <button className="btn-modal" onClick={handleSubmit}>Finalizar ✔</button>
                  </div>


                </div>
              )}

              <div className="step-indicator">
                <span className={step === 1 ? 'active' : ''}></span>
                <span className={step === 2 ? 'active' : ''}></span>
                <span className={step === 3 ? 'active' : ''}></span>
              </div>
            </div>
          </Modal>

          <ModalGustos
            open={showGustos}
            close={() => setShowGustos(false)}
            onFinish={handleFinishGustos}
          />
        </div>
      </div>

      {/* --- SECCIÓN DE CUADRADOS (REUTILIZADA) --- */}
      <div className="main-features-section">
        <FeatureCard
          icon="🔍"
          title="Exploración de Catálogo"
          description="Explorá un catálogo inmenso de libros y filtrá por género, o listados personalizados."
        />
        <FeatureCard
          icon="👥"
          title="Conectá con lectores apasionantes"
          description="Descubrí perfiles, seguí a otros usuarios, compartí opiniones y sé parte de clubes de lectura."
        />
        <FeatureCard
          icon="📚"
          title="Diario de Lecturas Personal"
          description="Registra tu progreso, puntuá, escribí reseñas y recomendá tus libros favoritos."
        />
      </div>
      {/* --------------------------- */}

      {/* --- FOOTER SIMPLE --- */}
      <footer className="footer-simple-registro">
        <p>&copy; {new Date().getFullYear()} NextRead. Todos los derechos reservados.</p>
      </footer>
      {/* --------------------------- */}
    </>
  );
}

export default Registrarse;