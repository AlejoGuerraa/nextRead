import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from '../ToastProvider';
import '../../pagescss/modals.css';

const API_BASE = 'http://localhost:3000/nextread';

export default function CrearListaModal({ isOpen, onClose, onCreated }) {
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token) { toast?.push('Debes iniciar sesión', 'error'); return; }
    if (!nombre || !nombre.trim()) return toast?.push('Ingrese un nombre válido', 'error');

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/listas`, { nombre }, { headers: { Authorization: `Bearer ${token}` } });
      toast?.push(res.data.message || 'Lista creada', 'success');
      setNombre('');
      if (onCreated) onCreated(res.data.listas);
      onClose();
    } catch (err) {
      console.error('Error creando lista', err);
      toast?.push(err.response?.data?.error || 'No se pudo crear la lista', 'error');
    } finally { setLoading(false); }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleCreate();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Crear nueva lista</h3>
        <input 
          value={nombre} 
          onChange={e => setNombre(e.target.value)} 
          onKeyPress={handleKeyPress}
          placeholder="Nombre de la lista" 
          autoFocus
        />
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleCreate} disabled={loading}>{loading ? 'Creando...' : 'Crear'}</button>
        </div>
      </div>
    </div>
  );
}
