// Acceso.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';

import icono from '../assets/libroIcono.png';
import CatalogoIcon from '../assets/1LogoAcceso.png';
import ComunidadIcon from '../assets/2LogoAcceso.png';
import DiarioIcon from '../assets/3LogoAcceso.png';

import { Modal } from '../components/acceso/modal';
import { ModalGustos } from '../components/acceso/modalBanners';
import { FeatureCard } from '../components/acceso/card';

import { Step1 } from '../components/acceso/pasos/datosCuenta';
import { Step2 } from '../components/acceso/pasos/datosPersonales';
import { Step3 } from '../components/acceso/pasos/personalizaPerfil';
import { LoginModal } from '../components/acceso/modalLogin';

import Footer from '../components/footer';
import HeaderAcceso from "../components/acceso/headerAcceso";

import '../pagescss/loguearse_registrarse.css';

export default function Acceso() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const { login } = useAuth();
  const { push } = useToast();

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
      await login(loginForm);

      setLoginOpen(false);
      navigate("/");
    } catch (err) {
      if (err.response?.data?.code === 'ACCOUNT_DISABLED') {
        setLoginError('Tu cuenta fue desactivada. Revisá tu correo electrónico para conocer el motivo.');
      } else {
        setLoginError(err.response?.data?.error || "Credenciales incorrectas.");
      }
    }
  };

  /* ------------------- REGISTRO ------------------- */
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = name === 'usuario'
      ? value.replace(/[^a-zA-Z0-9_]/g, '')
      : value;

    setRegisterForm((prev) => ({ ...prev, [name]: sanitizedValue }));
    if (registerErrors[name]) {
      setRegisterErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (name === 'usuario' && sanitizedValue !== value) {
      setRegisterErrors((prev) => ({
        ...prev,
        usuario: 'El usuario solo puede contener letras, números y guion bajo.',
      }));
    }
  };

  const handleUsernameAvailability = useCallback((message) => {
    setRegisterErrors((prev) => ({
      ...prev,
      usuario: message || (prev.usuario === 'Este nombre de usuario ya está en uso' ? undefined : prev.usuario),
    }));
  }, []);

  const validateStep1 = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const password = registerForm.contrasena.trim();

    if (!registerForm.correo.trim()) newErrors.correo = 'El correo es obligatorio.';
    else if (!emailRegex.test(registerForm.correo.trim())) newErrors.correo = 'Formato de correo inválido.';

    if (!password) newErrors.contrasena = 'La contraseña es obligatoria.';
    else if (password.length < 8) newErrors.contrasena = 'La contraseña debe tener al menos 8 caracteres.';
    else if (password.length > 128) newErrors.contrasena = 'La contraseña es demasiado larga.';
    else if (!/[A-Z]/.test(password)) newErrors.contrasena = 'La contraseña debe contener al menos una letra mayúscula.';

    if (!registerForm.repeatPassword) newErrors.repeatPassword = 'Debe repetir la contraseña.';
    else if (registerForm.contrasena !== registerForm.repeatPassword)
      newErrors.repeatPassword = 'Las contraseñas no coinciden.';

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    const nombre = registerForm.nombre.trim();
    const apellido = registerForm.apellido.trim();
    const usuario = registerForm.usuario.trim();

    if (!nombre) newErrors.nombre = 'El nombre es obligatorio.';
    else if (nombre.length < 2) newErrors.nombre = 'El nombre debe tener al menos 2 caracteres.';
    else if (nombre.length > 20) newErrors.nombre = 'El nombre no puede superar los 20 caracteres.';

    if (!apellido) newErrors.apellido = 'El apellido es obligatorio.';
    else if (apellido.length < 2) newErrors.apellido = 'El apellido debe tener al menos 2 caracteres.';
    else if (apellido.length > 20) newErrors.apellido = 'El apellido no puede superar los 20 caracteres.';

    if (!usuario) newErrors.usuario = 'El usuario es obligatorio.';
    else if (usuario.length < 3) newErrors.usuario = 'El usuario debe tener al menos 3 caracteres.';
    else if (usuario.length > 50) newErrors.usuario = 'El usuario no puede superar los 50 caracteres.';
    else if (!/^[a-zA-Z0-9_]+$/.test(usuario)) newErrors.usuario = 'El usuario solo puede contener letras, números y guion bajo.';

    const dateError = validateBirthDate(registerForm.nacimiento);
    if (dateError) newErrors.nacimiento = dateError;
    if (registerErrors.usuario === 'Este nombre de usuario ya está en uso') {
      newErrors.usuario = registerErrors.usuario;
    }

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (registerForm.descripcion.length > 300) {
      newErrors.descripcion = 'La descripción supera el límite de 300 caracteres.';
    }
    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBirthDate = (value) => {
    if (!value) return 'La fecha de nacimiento es obligatoria.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'La fecha de nacimiento tiene un formato inválido.';

    const [year, month, day] = value.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oldestDate = new Date(today);
    oldestDate.setFullYear(today.getFullYear() - 120);

    if (selectedDate.getFullYear() !== year || selectedDate.getMonth() !== month - 1 || selectedDate.getDate() !== day) {
      return 'La fecha ingresada no existe.';
    }
    if (selectedDate > today) return 'La fecha de nacimiento no puede ser futura.';
    if (selectedDate < oldestDate) return 'La fecha de nacimiento no puede tener más de 120 años.';
    return null;
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
      await api.post('/nextread/register', {
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

      await login({
        correo: registerForm.correo,
        contrasena: registerForm.contrasena,
      });

      setShowGustos(false);
      setRegisterOpen(false);
      navigate('/');
    } catch (error) {
      console.error(error);
      push('Error al registrar usuario.', 'error');
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
                onUsernameAvailability={handleUsernameAvailability}
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
                next={() => {
                  if (validateStep3()) {
                    setRegisterOpen(false);
                    setTimeout(() => setShowGustos(true), 100);
                  }
                }}
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
