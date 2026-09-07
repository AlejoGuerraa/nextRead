import React, { useEffect, useState } from 'react';
import { X, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ToastProvider';
import { removeBookFromList } from '../../services/listsService';

const getBookId = (book) => book?.id || book?.id_libro || book?.book_id || book?.idBook || null;
const getBookTitle = (book) => book?.titulo || book?.title || 'Libro sin título';
const getBookCover = (book) => book?.url_portada || book?.cover || book?.imagen || null;

export default function ListaDetalleModal({ list, onClose, onBooksUpdated }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [books, setBooks] = useState(list?.books || []);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    setBooks(list?.books || []);
  }, [list]);

  if (!list) return null;

  const handleRemove = async (event, book) => {
    event.stopPropagation();
    const bookId = getBookId(book);
    if (!bookId) return;

    setRemovingId(bookId);
    try {
      const data = await removeBookFromList(list.name, bookId);
      const nextBooks = books.filter((item) => Number(getBookId(item)) !== Number(bookId));
      setBooks(nextBooks);
      onBooksUpdated?.(data.listas);
      toast?.push('Libro quitado de la lista', 'success');
    } catch (error) {
      toast?.push(error.response?.data?.error || 'No se pudo quitar el libro', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="list-detail-overlay" onClick={onClose}>
      <section className="list-detail-modal" role="dialog" aria-modal="true" aria-labelledby="list-detail-title" onClick={(event) => event.stopPropagation()}>
        <header className="list-detail-header">
          <div>
            <h2 id="list-detail-title" style={{ color: 'white' }}>{list.name}</h2>
            <span>{books.length} {books.length === 1 ? 'libro' : 'libros'}</span>
          </div>
          <button className="list-icon-button" type="button" onClick={onClose} aria-label="Cerrar lista">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {books.length === 0 ? (
          <div className="list-detail-empty">
            <span className="list-empty-mark" aria-hidden="true" />
            <h3>Esta lista está vacía</h3>
            <p>Agregá libros desde su página de detalle para verlos acá.</p>
          </div>
        ) : (
          <div className="list-detail-books">
            {books.map((book, index) => {
              const bookId = getBookId(book);
              const cover = getBookCover(book);
              return (
                <article className="list-detail-book" key={bookId || index} onClick={() => bookId && navigate(`/libro/${bookId}`)}>
                  <div className="list-detail-cover">
                    {cover ? <img src={cover} alt={getBookTitle(book)} /> : <span className="list-cover-placeholder" aria-hidden="true" />}
                    <button className="list-remove-book" type="button" onClick={(event) => handleRemove(event, book)} disabled={removingId === bookId} aria-label={`Quitar ${getBookTitle(book)} de la lista`} title="Quitar de la lista">
                      <XCircle size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <h3>{getBookTitle(book)}</h3>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
