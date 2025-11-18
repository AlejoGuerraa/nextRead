
// File: src/components/settings/DeleteAccount.jsx
import React, { useState } from 'react';

export default function DeleteAccount() {
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = (e) => {
    e.preventDefault();
    if (confirmText !== 'ELIMINAR') return;
    alert('Petición de eliminación enviada (placeholder). En producción requerir revalidación y período de gracia.');
    // TODO: DELETE /api/account (revalidar contraseña, soft-delete / marked for deletion)
  };

  return (
    <section className="config-section danger">
      <h3>Eliminar cuenta</h3>
      <p className="muted">Eliminar tu cuenta es irreversible. Recomendamos desactivarla o exportar los datos antes.</p>

      <form onSubmit={handleDelete} className="config-form">
        <label>
          Escribe <strong>ELIMINAR</strong> para confirmar
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="ELIMINAR" />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-danger" disabled={confirmText !== 'ELIMINAR'}>Eliminar cuenta</button>
        </div>
      </form>
    </section>
  );
}