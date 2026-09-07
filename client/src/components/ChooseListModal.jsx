import React, { useState } from 'react';
import { useToast } from './ToastProvider';
import { addBookToList, createList, removeBookFromList } from '../services/listsService';
import '../pagescss/modals.css';

export default function ChooseListModal({ isOpen, onClose, listas = {}, bookId, onAdded }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (listName) => {
    if (!localStorage.getItem('token')) { toast?.push('Debes iniciar sesión', 'error'); return; }

    setLoading(true);
    try {
      const data = await addBookToList(listName, bookId);
      toast?.push(data.message || 'Libro agregado', 'success');
      if (onAdded) onAdded(data.listas);
      onClose();
    } catch (err) {
      console.error('Error agregando libro a lista', err);
      toast?.push(err.response?.data?.error || err.response?.data?.message || 'No se pudo agregar el libro', 'error');
    } finally { setLoading(false); }
  };

  const handleRemove = async (listName) => {
    setLoading(true);
    try {
      const data = await removeBookFromList(listName, bookId);
      toast?.push(data.message || 'Libro quitado de la lista', 'success');
      if (onAdded) onAdded(data.listas);
    } catch (err) {
      toast?.push(err.response?.data?.error || 'No se pudo quitar el libro', 'error');
    } finally { setLoading(false); }
  };

  const handleCreateAndAdd = async () => {
    const name = newListName.trim();
    if (!name) return toast?.push('Ingrese un nombre válido', 'error');
    setLoading(true);
    try {
      const created = await createList(name);
      await addBookToList(name, bookId);
      toast?.push('Lista creada y libro agregado', 'success');
      if (onAdded) onAdded(created.listas);
      onClose();
    } catch (err) {
      toast?.push(err.response?.data?.error || 'No se pudo crear la lista', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card lists-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Selecciona una lista</h3>
        {showCreate ? (
          <div className="list-create-inline">
            <input value={newListName} onChange={(event) => setNewListName(event.target.value)} placeholder="Nombre de la lista" autoFocus />
            <div className="modal-actions">
              <button className="btn" type="button" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button className="btn-primary" type="button" onClick={handleCreateAndAdd} disabled={loading}>Crear y agregar</button>
            </div>
          </div>
        ) : (
          <>
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
                    <div className="placeholder" aria-hidden="true" />
                  )}
                </div>
                <div className="meta">
                  <div className="list-name" title={name}>{name}</div>
                  <div className="count">{books ? books.length : 0} libros</div>
                  {books?.some((book) => Number(book?.id) === Number(bookId)) ? (
                    <button className="btn-small danger" onClick={() => handleRemove(name)} disabled={loading}>Quitar</button>
                  ) : (
                    <button className="btn-small" onClick={() => handleAdd(name)} disabled={loading}>Agregar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="btn-primary" type="button" onClick={() => setShowCreate(true)}>Crear nueva lista</button>
          </>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
