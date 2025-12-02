
// File: src/components/settings/AdminBanUser.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/nextread';

export default function AdminBanUser() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingBan, setLoadingBan] = useState(false);

  useEffect(() => {
    const doSearch = async () => {
      if (!query || query.trim().length === 0) return setResults([]);
      setLoadingSearch(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/buscar-usuario?q=${encodeURIComponent(query)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        // Normalizar ids a números para evitar problemas de comparación
        const normalized = (res.data.results || []).map(u => ({ ...u, id: u.id ? Number(u.id) : u.id }));
        setResults(normalized);
      } catch (err) {
        console.error('Error buscando usuarios:', err);
        setMessage({ type: 'error', text: 'Error buscando usuarios' });
      } finally {
        setLoadingSearch(false);
      }
    };

    const t = setTimeout(doSearch, 350);
    return () => clearTimeout(t);
  }, [query]);

  const handleConfirmBan = async () => {
    if (!selectedUser) return setMessage({ type: 'error', text: 'Seleccioná un usuario para banear' });
    if (!reason || !reason.trim()) return setMessage({ type: 'error', text: 'Ingresá un motivo para el baneo' });

    setLoadingBan(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return setMessage({ type: 'error', text: 'No autenticado' });

      const res = await axios.patch(`${API_BASE}/admin/ban/${selectedUser.id}`, { descargo: reason }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage({ type: 'success', text: res.data.message || 'Usuario baneado correctamente' });
      // opcional: actualizar lista
      setResults(prev => prev.filter(u => u.id !== selectedUser.id));
      setSelectedUser(null);
      setReason('');
    } catch (err) {
      console.error('Error baneando usuario:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al banear usuario' });
    } finally {
      setLoadingBan(false);
    }
  };

  return (
    <section className="config-section admin-ban">
      <h3>Banear usuario (solo admins)</h3>

      <label>
        Buscar usuario (nombre, correo o usuario)
        <input value={query} onChange={(e) => { setQuery(e.target.value); setMessage(null); }} placeholder="buscar..." />
      </label>

      <ul className="search-results">
        {loadingSearch && <li className="muted">Buscando...</li>}
        {results.map(u => (
          <li
            key={u.id}
            className={Number(selectedUser?.id) === Number(u.id) ? 'selected' : ''}
            onClick={() => { setSelectedUser({ ...u, id: Number(u.id) }); setMessage(null); }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedUser({ ...u, id: Number(u.id) }); setMessage(null); } }}
          >
            <strong>{u.usuario}</strong> — {u.nombre} ({u.correo})
          </li>
        ))}
      </ul>

      <label>
        Motivo del baneo
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describí brevemente el motivo..." />
      </label>

      <div className="form-actions">
        <button className="btn-danger" type="button" onClick={handleConfirmBan} disabled={loadingBan}>{loadingBan ? 'Procesando...' : 'Confirmar baneo'}</button>
      </div>

      {message && <p className={"info " + (message.type === 'error' ? 'error' : '')}>{message.text}</p>}

      {/* Nota removida por solicitud del equipo */}
    </section>
  );
}
