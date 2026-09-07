import { useEffect, useState } from "react";
import api from '../../../services/api';

export const Step2 = ({ form, errors, onChange, onUsernameAvailability, next, back }) => {
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(form.usuario)) {
      setCheckingUsername(false);
      return undefined;
    }

    let active = true;
    setCheckingUsername(true);
    api.get(`/nextread/check-username?usuario=${encodeURIComponent(form.usuario)}`)
      .then((response) => {
        if (active) {
          setCheckingUsername(false);
          onUsernameAvailability(response.data.exists ? 'Este nombre de usuario ya está en uso' : null);
        }
      })
      .catch((error) => {
        if (active) setCheckingUsername(false);
        console.error('Error al verificar usuario:', error);
      });

    return () => {
      active = false;
    };
  }, [form.usuario, onUsernameAvailability]);

  const handleNext = () => {
    if (checkingUsername) {
      onUsernameAvailability('Estamos verificando la disponibilidad del usuario.');
      return;
    }
    next();
  };

  return (
    <div className="step">
      <style>{`
        .step input { width: 100%; padding: 10px 12px; font-size: 16px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box; margin-bottom: 10px; transition: box-shadow 0.2s, border-color 0.2s; }
        .step input::placeholder { font-size: 16px; color: #999; opacity: 1; }
        .step input:focus { border-color: #1A374D; box-shadow: 0 2px 8px rgba(26, 55, 77, 0.2); outline: none; }
        .input-error { border-color: #f44336; }
        .error-message { color: #f44336; font-size: 14px; margin: 0 0 8px 0; text-align: left; }
        .buttons { display: flex; justify-content: space-between; margin-top: 12px; }
        .btn-modal { padding: 10px 20px; border: none; border-radius: 8px; background-color: #1A374D; color: white; font-size: 16px; cursor: pointer; transition: background-color 0.2s, box-shadow 0.2s; }
        .btn-modal:hover { background-color: #406882; box-shadow: 0 2px 8px rgba(26, 55, 77, 0.2); }
      `}</style>

      <h2>Crea tu usuario</h2>

      <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={onChange} className={errors.nombre ? "input-error" : ""} maxLength={20} />
      {errors.nombre && <p className="error-message">{errors.nombre}</p>}

      <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={onChange} className={errors.apellido ? "input-error" : ""} maxLength={20} />
      {errors.apellido && <p className="error-message">{errors.apellido}</p>}

      <input name="usuario" placeholder="UserName" value={form.usuario} onChange={onChange} className={errors.usuario ? "input-error" : ""} maxLength={50} />
      {errors.usuario && <p className="error-message">{errors.usuario}</p>}

      <input type="date" name="nacimiento" value={form.nacimiento} onChange={onChange} className={errors.nacimiento ? "input-error" : ""} />
      {errors.nacimiento && <p className="error-message">{errors.nacimiento}</p>}

      <div className="buttons">
        <button className="btn-modal" onClick={back}>← Atrás</button>
        <button className="btn-modal" onClick={handleNext}>Terminado ➜</button>
      </div>
    </div>
  );
};
