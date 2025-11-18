
// File: src/components/settings/ChangePassword.jsx
import React, { useState } from 'react';

export default function ChangePassword() {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [message, setMessage] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    if (newPwd.length < 6) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    setMessage({ type: 'info', text: 'Aquí se dispararía la petición para cambiar la contraseña (placeholder).' });
  };

  return (
    <section className="config-section">
      <h3>Cambiar contraseña</h3>
      <form onSubmit={handleSubmit} className="config-form">
        <label>
          Contraseña actual
          <input
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            required
          />
        </label>

        <label>
          Nueva contraseña
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
          />
        </label>

        <label>
          Confirmar nueva contraseña
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            required
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Cambiar contraseña</button>
        </div>

        {message && <p className={"info " + (message.type === 'error' ? 'error' : '')}>{message.text}</p>}
      </form>
    </section>
  );
}

