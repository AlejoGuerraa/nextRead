import React, { useState } from 'react';
import { MoreVertical, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../ToastProvider';
import { deleteList, renameList, updateListVisibility } from '../../services/listsService';
import ListaDetalleModal from './ListaDetalleModal';

const getBookCover = (book) => book?.url_portada || book?.cover || book?.imagen || null;

export default function ListaCard({ name, books = [], isPrivate = false, onUpdated }) {
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [nextName, setNextName] = useState(name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [privateState, setPrivateState] = useState(isPrivate);

  const updateLists = (lists) => onUpdated?.(lists);

  const handleRename = async () => {
    const trimmedName = nextName.trim();
    if (!trimmedName) {
      toast?.push('Ingrese un nombre válido', 'error');
      return;
    }
    if (trimmedName.length > 50) {
      toast?.push('El nombre de la lista no puede superar los 50 caracteres', 'error');
      return;
    }
    if (trimmedName === name) {
      setEditOpen(false);
      return;
    }

    setLoading(true);
    try {
      const data = await renameList(name, trimmedName);
      updateLists(data.listas);
      setEditOpen(false);
      setMenuOpen(false);
      toast?.push(data.message || 'Lista actualizada', 'success');
    } catch (error) {
      toast?.push(error.response?.data?.error || 'No se pudo editar la lista', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const data = await deleteList(name);
      updateLists(data.listas);
      setConfirmDelete(false);
      setMenuOpen(false);
      toast?.push(data.message || 'Lista eliminada', 'success');
    } catch (error) {
      toast?.push(error.response?.data?.error || 'No se pudo eliminar la lista', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVisibility = async () => {
    const nextValue = !privateState;
    setLoading(true);
    try {
      const data = await updateListVisibility(name, nextValue);
      setPrivateState(nextValue);
      updateLists(data.listas);
      setMenuOpen(false);
      toast?.push(nextValue ? 'Lista privada' : 'Lista pública', 'success');
    } catch (error) {
      toast?.push(error.response?.data?.error || 'No se pudo cambiar la visibilidad', 'error');
    } finally { setLoading(false); }
  };

  return (
    <>
      <article className="profile-list-card" onClick={() => setDetailOpen(true)}>
        <div className="profile-list-card-cover">
          {getBookCover(books[0]) ? <img src={getBookCover(books[0])} alt="" /> : <span className="profile-list-empty-cover" aria-hidden="true" />}
        </div>
        <div className="profile-list-card-content">
          <h4 title={name}>{name}</h4>
          <span>{books.length} {books.length === 1 ? 'libro' : 'libros'}</span>
        </div>
        <div className="profile-list-menu-wrap" onClick={(event) => event.stopPropagation()}>
          <button className="profile-list-menu-button" type="button" onClick={() => setMenuOpen((current) => !current)} aria-label={`Opciones de ${name}`} aria-expanded={menuOpen}>
            <MoreVertical size={19} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div className="profile-list-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setNextName(name); setEditOpen(true); setMenuOpen(false); }}>
                <Pencil size={16} aria-hidden="true" /> Cambiar nombre
              </button>
              <button type="button" role="menuitem" onClick={handleVisibility} disabled={loading}>
                {privateState ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />} Cambiar visibilidad
              </button>
              {confirmDelete ? (
                <div className="profile-list-delete-confirm">
                  <span>¿Eliminar esta lista?</span>
                  <div>
                    <button type="button" onClick={handleDelete} disabled={loading}>Confirmar</button>
                    <button type="button" onClick={() => setConfirmDelete(false)} disabled={loading}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <button className="is-danger" type="button" role="menuitem" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={16} aria-hidden="true" /> Eliminar lista
                </button>
              )}
            </div>
          )}
        </div>
      </article>

      {detailOpen && (
        <ListaDetalleModal
          list={{ name, books }}
          onClose={() => setDetailOpen(false)}
          onBooksUpdated={updateLists}
        />
      )}

      {editOpen && (
        <div className="list-edit-overlay" onClick={() => setEditOpen(false)}>
          <div className="list-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-list-title" onClick={(event) => event.stopPropagation()}>
            <h3 id="edit-list-title">Cambiar nombre</h3>
            <input value={nextName} onChange={(event) => setNextName(event.target.value)} maxLength={50} autoFocus />
            <span className="list-name-counter">{nextName.length}/50</span>
            <div className="list-edit-actions">
              <button type="button" onClick={() => setEditOpen(false)}>Cancelar</button>
              <button type="button" onClick={handleRename} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
