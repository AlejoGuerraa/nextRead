import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../pagescss/loguearse_registrarse.css';
import icono from '../assets/libroIcono.png';
import { Modal } from '../components/modal';
import { ModalGustos } from '../components/modalGustos';

const FeatureCard = ({icon, titulo, descripcion }) => (
  <div className = "feature-card">
    <div className = "feature-icon-text">
      {icon}
    </div>
    <h4 className = "feature-titulo">
      {titulo}
    </h4>
    <p className = "feature-descripcion">
      {descripcion}
    </p>
  </div>
);


function Registrarse() {
  const [modal, setModal] = useState(false);
  const [showGustos, setShowGustos] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();


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

  const handleChange = (e) => setForm(
    { ...form, [e.target.name]: e.target.value }
  );
  const nextStep = () => setStep((s) => Math.min(3, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  // Solo abre el modal de gustos después del registro local
  const handleSubmit = () => {
    if (!form.correo || !form.contrasena || !form.repeatPassword 
      || !form.nombre || !form.apellido || !form.usuario || !form.nacimiento || 
      !form.descripcion 
    ) {
      alert('Por favor complete todos los campos.');
      return;
    }
    if (form.contrasena !== form.repeatPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    setModal(false);
    setShowGustos(true);
  };

  // Función que se ejecuta cuando ModalGustos finaliza
  const handleFinishGustos = async (libros, generos, autores) => {
    try {
      const response = await axios.post('http://localhost:3000/nextread/register', { //guardamos la respuesta
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
      localStorage.setItem('user', JSON.stringify(userData)); //guardamos en LocalStorage

      navigate('/logueado');
    } catch (error) {
      alert('Error al registrar usuario: ' + (error.response?.data?.error || error.message));
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
              {step === 1 && (
                <div className="step">
                  <h2>Forma parte de NextRead</h2>
                  <input type="email" name="correo" placeholder="Email" value={form.correo} onChange={handleChange} />
                  <input type="password" name="contrasena" placeholder="Contraseña" value={form.contrasena} onChange={handleChange} />
                  <input type="password" name="repeatPassword" placeholder="Repetir contraseña" value={form.repeatPassword} onChange={handleChange} />

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

              {step === 2 && (
                <div className="step">
                  <h2>Crea tu usuario</h2>
                  <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} />
                  <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} />
                  <input name="usuario" placeholder="UserName" value={form.usuario} onChange={handleChange} />
                  <input type="date" name="nacimiento" value={form.nacimiento} onChange={handleChange} />

                  <div className="buttons">
                    <button className="btn-modal" onClick={prevStep}>← Atrás</button>
                    <button className="btn-modal" onClick={nextStep}>Siguiente ➜</button>
                  </div>
                </div>
              )}

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
                  />

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

      {/*Sección cuadrados debajo de la imagen*/}
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


    </>
  );
}

export default Registrarse;
