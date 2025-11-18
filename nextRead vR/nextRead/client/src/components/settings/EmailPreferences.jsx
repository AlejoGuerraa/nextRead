

// File: src/components/settings/EmailPreferences.jsx
import React, { useState } from 'react';

export default function EmailPreferences() {
  const [recommendations, setRecommendations] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [social, setSocial] = useState(true);
  const [message, setMessage] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    setMessage('Preferencias guardadas (placeholder)');
    // TODO: PUT /api/settings (emailNotifications)
  };

  return (
    <section className="config-section">
      <h3>Preferencias de recibir correos</h3>
      <form onSubmit={handleSave} className="config-form">
        <label className="toggle">
          <input type="checkbox" checked={recommendations} onChange={() => setRecommendations(!recommendations)} />
          Recibir recomendaciones por correo
        </label>

        <label className="toggle">
          <input type="checkbox" checked={weeklySummary} onChange={() => setWeeklySummary(!weeklySummary)} />
          Resumen semanal
        </label>

        <label className="toggle">
          <input type="checkbox" checked={social} onChange={() => setSocial(!social)} />
          Notificaciones sociales (seguidores / comentarios)
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-secondary">Guardar preferencias</button>
        </div>

        {message && <p className="info">{message}</p>}
      </form>
    </section>
  );
}
