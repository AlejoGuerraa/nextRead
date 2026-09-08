import React, { useState } from 'react';
import { useToast } from '../ToastProvider';
import { createList } from '../../services/listsService';
import '../../pagescss/modals.css';

export default function CrearListaModal({ isOpen, onClose, onCreated }) {
  const [nombre, setNombre] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!localStorage.getItem('token')) { toast?.push('Debes iniciar sesión', 'error'); return; }
    if (!nombre || !nombre.trim()) return toast?.push('Ingrese un nombre válido', 'error');
    if (nombre.trim().length > 50) return toast?.push('El nombre de la lista no puede superar los 50 caracteres', 'error');

    setLoading(true);
    try {
      const data = await createList(nombre.trim(), isPrivate);
      toast?.push(data.message || 'Lista creada', 'success');
      setNombre('');
      setIsPrivate(false);
      if (onCreated) onCreated(data.listas);
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
          onChange={e => setNombre(e.target.value.slice(0, 50))}
          maxLength={50}
          onKeyPress={handleKeyPress}
          placeholder="Nombre de la lista" 
          autoFocus
        />
        <span className="list-name-counter">{nombre.length}/50</span>
        <label className="list-privacy-switch">
          <input type="checkbox" checked={isPrivate} onChange={(event) => setIsPrivate(event.target.checked)} aria-label="Hacer lista privada" />
          <span className="list-privacy-slider" aria-hidden="true" />
          <span>Privada</span>
        </label>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleCreate} disabled={loading}>{loading ? 'Creando...' : 'Crear'}</button>
        </div>
      </div>
    </div>
  );
}
