
// File: src/components/settings/AdminBanUser.jsx
import React, { useEffect, useState } from 'react';

const mockUsers = [
  { id: 1, nombre: 'Loco Gonzalez', correo: 'loco@gmail.com', usuario: 'Locochon23' },
  { id: 2, nombre: 'María Pérez', correo: 'maria@example.com', usuario: 'mariap' },
  { id: 3, nombre: 'Juan López', correo: 'juan@example.com', usuario: 'juanl' }
];

export default function AdminBanUser() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!query) return setResults([]);
    const q = query.toLowerCase();
    const filtered = mockUsers.filter(u =>
      u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q) || u.usuario.toLowerCase().includes(q)
    );
    setResults(filtered);
  }, [query]);

  const handleConfirmBan = () => {
    if (!selectedUser) return setMessage({ type: 'error', text: 'Seleccioná un usuario para banear' });
    if (!reason) return setMessage({ type: 'error', text: 'Ingresá un motivo para el baneo' });

    setMessage({ type: 'info', text: `Se enviaría la petición para banear a ${selectedUser.usuario} (placeholder).` });
    // TODO: POST /api/admin/ban => { userId: selectedUser.id, reason }
    // Backend: set isActive = false (NO borrar registro), enviar email al usuario,
    // y generar un mensaje cuando intente loguear que diga "Cuenta inactiva".
  };

  return (
    <section className="config-section admin-ban">
      <h3>Banear usuario (solo admins)</h3>

      <label>
        Buscar usuario (nombre, correo o usuario)
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="buscar..." />
      </label>

      <ul className="search-results">
        {results.map(u => (
          <li key={u.id} className={selectedUser?.id === u.id ? 'selected' : ''} onClick={() => { setSelectedUser(u); setMessage(null); }}>
            <strong>{u.usuario}</strong> — {u.nombre} ({u.correo})
          </li>
        ))}
      </ul>

      <label>
        Motivo del baneo
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describí brevemente el motivo..." />
      </label>

      <div className="form-actions">
        <button className="btn-danger" type="button" onClick={handleConfirmBan}>Confirmar baneo</button>
      </div>

      {message && <p className={"info " + (message.type === 'error' ? 'error' : '')}>{message.text}</p>}

      <div className="muted small">
        Nota: En producción el baneo debe marcar <code>isActive = false</code> (no borrar la cuenta). El usuario debe recibir un mail y al intentar loguear ver un mensaje que explique que su cuenta está inactiva.
      </div>
    </section>
  );
}
