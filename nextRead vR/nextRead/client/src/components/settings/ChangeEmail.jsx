
// File: src/components/settings/ChangeEmail.jsx
import React, { useState } from 'react';

export default function ChangeEmail() {
  const [email, setEmail] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email !== confirm) {
      setMessage({ type: 'error', text: 'Los correos no coinciden.' });
      return;
    }
    setMessage({ type: 'info', text: 'Aquí se dispararía la petición para cambiar el correo (placeholder).' });
  };

  return (
    <section className="config-section">
      <h3>Cambiar correo electrónico</h3>
      <form onSubmit={handleSubmit} className="config-form">
        <label>
          Nuevo correo
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
            required
          />
        </label>

        <label>
          Confirmar correo
          <input
            type="email"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="ejemplo@correo.com"
            required
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Solicitar cambio</button>
        </div>

        {message && <p className={"info " + (message.type === 'error' ? 'error' : '')}>{message.text}</p>}
      </form>
    </section>
  );
}