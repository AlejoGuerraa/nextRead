// Acceso.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import icono from '../assets/libroIcono.png';
import CatalogoIcon from '../assets/1LogoAcceso.png';
import ComunidadIcon from '../assets/2LogoAcceso.png';
import DiarioIcon from '../assets/3LogoAcceso.png';

import { Modal } from '../components/acceso/modal';
import { ModalGustos } from '../components/acceso/modalBanners';
import { FeatureCard } from '../components/acceso/card';

import { Step1 } from '../components/acceso/pasos/paso1';
import { Step2 } from '../components/acceso/pasos/paso2';
import { Step3 } from '../components/acceso/pasos/paso3';
import { LoginModal } from '../components/acceso/modalLogin';

import Footer from '../components/footer';
import HeaderAcceso from "../components/acceso/headerAcceso";

import '../pagescss/loguearse_registrarse.css';

export default function Acceso() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  /* Login */
  const [loginForm, setLoginForm] = useState({ correo: '', contrasena: '' });
  const [loginError, setLoginError] = useState('');

  /* Registro */
  const [registerStep, setRegisterStep] = useState(1);
  const [registerErrors, setRegisterErrors] = useState({});

  // ✅ AVATARES REALES (ubicados en public/iconos/)
  const avatarOptions = [
    "src/assets/iconos/LogoDefault1.jpg",
    "src/assets/iconos/LogoDefault2.png",
    "src/assets/iconos/LogoDefault3.jpg",
    "src/assets/iconos/LogoDefault4.png",
  ];

  const [registerForm, setRegisterForm] = useState({
    correo: '',
    contrasena: '',
    repeatPassword: '',
    nombre: '',
    apellido: '',
    usuario: '',
    nacimiento: '',
    descripcion: '',
    avatar: avatarOptions[0], // primera imagen real
  });

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showGustos, setShowGustos] = useState(false);

  useEffect(() => {
    const modalParam = params.get('modal');
    if (modalParam === 'login') setLoginOpen(true);
    else if (modalParam === 'register') setRegisterOpen(true);
  }, [location.search]);

  /* ------------------- LOGIN ------------------- */
  const handleLoginChange = (e) =>
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!loginForm.correo || !loginForm.contrasena) {
      setLoginError("Por favor complete todos los campos.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/nextread/login", loginForm);

      localStorage.setItem(
        "user",
        JSON.stringify({ ...response.data, correo: loginForm.correo })
      );

      setLoginOpen(false);
      navigate("/");
    } catch (err) {
      setLoginError(err.response?.data?.error || "Credenciales incorrectas.");
    }
  };

  /* ------------------- REGISTRO ------------------- */
  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
    if (registerErrors[e.target.name]) {
      setRegisterErrors((prev) => ({ ...prev, [e.target.name]: null }));
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
    if (!registerForm.usuario) newErrors.usuario = 'El usuario es obligatorio.';
    if (!registerForm.nacimiento) newErrors.nacimiento = 'La fecha es obligatoria.';

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextRegisterStep = () => {
    const valid = registerStep === 1 ? validateStep1() : validateStep2();
    if (valid) setRegisterStep((s) => Math.min(3, s + 1));
  };

  const prevRegisterStep = () => setRegisterStep((s) => Math.max(1, s - 1));

  // ⭐ Maneja el avatar seleccionado
  const handleToggleAvatar = (value) => {
    if (typeof value === 'string') {
      setRegisterForm((prev) => ({ ...prev, avatar: value }));
      setShowAvatarPicker(false);
      return;
    }
    setShowAvatarPicker((prev) => !prev);
  };

  const handleFinishGustos = async (bannerUrl) => {
    try {
      await axios.post('http://localhost:3000/nextread/register', {
        nombre: registerForm.nombre,
        apellido: registerForm.apellido,
        correo: registerForm.correo,
        usuario: registerForm.usuario,
        contrasena: registerForm.contrasena,
        fecha_nacimiento: registerForm.nacimiento,
        icono: registerForm.avatar,
        banner: bannerUrl,
        descripcion: registerForm.descripcion,
      });

      const loginResponse = await axios.post('http://localhost:3000/nextread/login', {
        correo: registerForm.correo,
        contrasena: registerForm.contrasena,
      });

      localStorage.setItem(
        'user',
        JSON.stringify({ ...loginResponse.data, correo: registerForm.correo, banner: bannerUrl })
      );

      setShowGustos(false);
      setRegisterOpen(false);
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Error al registrar usuario.');
    }
  };

  return (
    <>
      <HeaderAcceso />

      <div className="contenedor-imagen-acceso">
        <div className="texto-superpuesto">
          <h3 className="slogan-text">Descubrí tu próxima <br /> Gran Lectura</h3>
          <button className="btn-registro-pagina" onClick={() => setRegisterOpen(true)}>Comenzar</button>

          <Modal openModal={registerOpen} closeModal={() => setRegisterOpen(false)}>
            {registerStep === 1 && (
              <Step1
                form={registerForm}
                errors={registerErrors}
                onChange={handleRegisterChange}
                next={nextRegisterStep}
                openLogin={() => { setRegisterOpen(false); setLoginOpen(true); setRegisterStep(1); }}
              />
            )}

            {registerStep === 2 && (
              <Step2
                form={registerForm}
                errors={registerErrors}
                onChange={handleRegisterChange}
                next={nextRegisterStep}
                back={prevRegisterStep}
              />
            )}

            {registerStep === 3 && (
              <Step3
                form={registerForm}
                errors={registerErrors}
                onChange={handleRegisterChange}
                avatarOptions={avatarOptions}
                toggleAvatar={handleToggleAvatar}
                showPicker={showAvatarPicker}
                next={() => { setRegisterOpen(false); setTimeout(() => setShowGustos(true), 100); }}
                back={prevRegisterStep}
              />
            )}

            <div className="step-indicator">
              <span className={registerStep === 1 ? 'active' : ''}></span>
              <span className={registerStep === 2 ? 'active' : ''}></span>
              <span className={registerStep === 3 ? 'active' : ''}></span>
            </div>
          </Modal>

          <ModalGustos
            open={showGustos}
            close={() => setShowGustos(false)}
            onFinish={handleFinishGustos}
            onBack={() => { setShowGustos(false); setTimeout(() => { setRegisterStep(3); setRegisterOpen(true); }, 100); }}
          />

          <LoginModal
            open={loginOpen}
            close={() => setLoginOpen(false)}
            loginForm={loginForm}
            onChange={handleLoginChange}
            submit={handleLoginSubmit}
            error={loginError}
            openRegister={() => { setLoginOpen(false); setRegisterOpen(true); setRegisterStep(1); }}
          />
        </div>
      </div>

      <div className="main-features-section">
        <FeatureCard icon={CatalogoIcon} title="Exploración de Catálogo" description="Explorá un catálogo inmenso y filtrá por género o listas." />
        <FeatureCard icon={ComunidadIcon} title="Conectá con lectores" description="Descubrí perfiles, seguí, compartí y unite a clubes de lectura." />
        <FeatureCard icon={DiarioIcon} title="Diario de Lecturas" description="Registrá tu progreso y recomendá tus libros favoritos." />
      </div>

      <Footer />
    </>
  );
}
