import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import Header from '../components/header';
import Footer from '../components/footer';
import { useAuth } from '../hooks/useAuth';
import { getAuthorDetails } from '../services/booksService';
import './AuthorPage.css';

const PAGE_SIZE = 50;

function AuthorBookTile({ book }) {
  const [failedCover, setFailedCover] = useState(null);
  const cover = book.url_portada || null;
  const hasCover = Boolean(cover && failedCover !== cover);

  return (
    <Link
      to={`/libro/${book.id}`}
      className="author-book-tile"
      aria-label={`Ver detalles de ${book.titulo || 'libro'}`}
    >
      <span className="author-book-cover">
        {hasCover ? (
          <img
            src={cover}
            alt={`Portada de ${book.titulo || 'libro'}`}
            loading="lazy"
            decoding="async"
            onError={() => setFailedCover(cover)}
          />
        ) : (
          <span className="author-book-placeholder">
            <BookOpen size={28} aria-hidden="true" />
            <span>Sin portada</span>
          </span>
        )}
      </span>
      <span className="author-book-title">{book.titulo || 'Sin título'}</span>
    </Link>
  );
}

export default function AuthorPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [author, setAuthor] = useState(null);
  const [books, setBooks] = useState([]);
  const [nextPage, setNextPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const fetchAuthor = async () => {
      setLoading(true);
      setError('');
      setAuthor(null);
      setBooks([]);
      setNextPage(1);
      setHasMore(false);

      try {
        const data = await getAuthorDetails(id, { limit: PAGE_SIZE, page: 1 });
        if (!isActive) return;
        setAuthor(data.autor);
        setBooks(Array.isArray(data.libros) ? data.libros : []);
        setHasMore(data.hasMore === true);
        setNextPage(data.nextPage || 1);
      } catch (requestError) {
        console.error('Error loading author page:', requestError);
        if (isActive) setError('No se pudieron cargar los datos del autor.');
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchAuthor();
    return () => {
      isActive = false;
    };
  }, [id]);

  const loadMoreBooks = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError('');

    try {
      const data = await getAuthorDetails(id, {
        limit: PAGE_SIZE,
        page: nextPage,
      });
      setBooks((currentBooks) => {
        const existingIds = new Set(currentBooks.map((book) => Number(book.id)));
        return [
          ...currentBooks,
          ...(Array.isArray(data.libros) ? data.libros : [])
            .filter((book) => !existingIds.has(Number(book.id))),
        ];
      });
      setHasMore(data.hasMore === true);
      setNextPage(data.nextPage || nextPage);
    } catch (requestError) {
      console.error('Error loading more author books:', requestError);
      setError('No se pudieron cargar más libros.');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, id, loadingMore, nextPage]);

  const bookCountLabel = `${books.length}${hasMore ? '+' : ''} ${books.length === 1 && !hasMore ? 'libro' : 'libros'} en NextRead`;

  return (
    <div className="author-page">
      <Header user={user} />
      <main className="author-page-main">
        {loading ? (
          <p className="author-state" role="status">Cargando autor...</p>
        ) : error && !author ? (
          <p className="author-state author-state--error" role="alert">{error}</p>
        ) : author ? (
          <>
            <section className="author-hero" aria-label={`Perfil de ${author.nombre}`}>
              {author.url_cara ? (
                <img src={author.url_cara} alt="" className="author-hero-image" />
              ) : (
                <div className="author-hero-fallback" aria-hidden="true">
                  {(author.nombre || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <h1 className="author-hero-name">{author.nombre}</h1>
              <p className="author-hero-count">{bookCountLabel}</p>
            </section>

            <section className="author-works" aria-label={`Obras de ${author.nombre}`}>
              <h2 className="author-works-title">Obras</h2>
              {books.length > 0 ? (
                <div className="author-books-grid">
                  {books.map((book) => (
                    <AuthorBookTile book={book} key={book.id} />
                  ))}
                </div>
              ) : (
                <p className="author-empty">No hay libros disponibles para este autor.</p>
              )}
              {error ? <p className="author-state author-state--error" role="alert">{error}</p> : null}
              {hasMore ? (
                <button
                  className="author-load-more"
                  disabled={loadingMore}
                  onClick={loadMoreBooks}
                  type="button"
                >
                  {loadingMore ? 'Cargando...' : 'Ver más'}
                </button>
              ) : null}
            </section>
          </>
        ) : (
          <p className="author-state author-state--error" role="alert">Autor no encontrado.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
