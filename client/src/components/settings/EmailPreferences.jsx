// File: src/components/settings/EmailPreferences.jsx
import React, { useState } from "react";

/**
 * Componente ToggleSwitch (interno, simple, accesible)
 */
function ToggleSwitch({ id, checked, onChange, label, description }) {
  return (
    <div className="pref-row">
      <div className="pref-text">
        <label htmlFor={id} className="pref-label">{label}</label>
        {description && <div className="pref-desc">{description}</div>}
      </div>

      <div className="pref-toggle">
        <input
          id={id}
          role="switch"
          aria-checked={checked}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switch-visual" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function EmailPreferences() {
  const [recommendations, setRecommendations] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [social, setSocial] = useState(true);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Simular petición; en producción haces PUT /api/settings/emailNotifications
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: "success", text: "Preferencias guardadas correctamente." });
    }, 650);
  };

  const handleReset = () => {
    setRecommendations(true);
    setWeeklySummary(false);
    setSocial(true);
    setMessage({ type: "info", text: "Preferencias reiniciadas." });
  };

  return (
    <section className="config-section">
      <div className="section-head">
        <h3>Preferencias de correo</h3>
        <p className="muted small">Controlá qué tipo de correos querés recibir.</p>
      </div>

      <form onSubmit={handleSave} className="config-form prefs-form">
        {/*
        <ToggleSwitch
          id="pref-reco"
          checked={recommendations}
          onChange={setRecommendations}
          label="Recibir recomendaciones"
          description="Sugerencias personalizadas según tu actividad."
        />
        
        <ToggleSwitch
          id="pref-weekly"
          checked={weeklySummary}
          onChange={setWeeklySummary}
          label="Resumen semanal"
          description="Resumen con lo más importante de la semana."
        />
        */}
        <ToggleSwitch
          id="pref-social"
          checked={social}
          onChange={setSocial}
          label="Notificaciones sociales"
          description="Avisos sobre nuevos seguidores, comentarios y reacciones."
        />

        <div className="form-actions actions-right">
          <button type="button" className="btn-secondary" onClick={handleReset} disabled={saving}>Reiniciar</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Guardando..." : "Guardar preferencias"}</button>
        </div>

        {message && (
          <div className={"info " + (message.type === "success" ? "" : message.type === "info" ? "muted" : "error")}>
            {message.text}
          </div>
        )}
      </form>
    </section>
  );
}
