import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from './ToastProvider';
import '../pagescss/modals.css';

const API_BASE = 'http://localhost:3000/nextread';

export default function ChooseListModal({ isOpen, onClose, listas = {}, bookId, onAdded }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (listName) => {
    const token = localStorage.getItem('token');
    if (!token) { toast?.push('Debes iniciar sesión', 'error'); return; }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/listas/${encodeURIComponent(listName)}/libro/${bookId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast?.push(res.data.message || 'Libro agregado', 'success');
      if (onAdded) onAdded(listName, res.data.lista);
      onClose();
    } catch (err) {
      console.error('Error agregando libro a lista', err);
      toast?.push(err.response?.data?.error || err.response?.data?.message || 'No se pudo agregar el libro', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card lists-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Selecciona una lista</h3>
        {Object.keys(listas).length === 0 ? (
          <div className="empty">No tienes listas aún. Crea una desde tu perfil.</div>
        ) : (
          <div className="lists-grid">
            {Object.entries(listas).map(([name, books]) => (
              <div key={name} className="list-item">
                <div className="cover">
                  {books && books.length > 0 && books[0].url_portada ? (
                    <img src={books[0].url_portada} alt={books[0].titulo} />
                  ) : (
                    <div className="placeholder">📘</div>
                  )}
                </div>
                <div className="meta">
                  <div className="list-name" title={name}>{name}</div>
                  <div className="count">{books ? books.length : 0} libros</div>
                  <button className="btn-small" onClick={() => handleAdd(name)} disabled={loading}>Agregar</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
